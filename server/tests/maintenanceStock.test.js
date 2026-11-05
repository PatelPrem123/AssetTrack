import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Asset } from '../src/models/Asset.js';
import { AssetCategory } from '../src/models/AssetCategory.js';
import { Department } from '../src/models/Department.js';
import { Location } from '../src/models/Location.js';
import { StockItem } from '../src/models/StockItem.js';
import { StockMovement } from '../src/models/StockMovement.js';
import { MaintenanceRecord } from '../src/models/MaintenanceRecord.js';
import { ComponentChange } from '../src/models/ComponentChange.js';
import { Vendor } from '../src/models/Vendor.js';

describe('Phase 7, 8 & 9 - Maintenance Center, Component Evolution & Spare Parts Ledger (DEC-005, DEC-006)', () => {
  let adminToken = '';
  let techToken = '';
  let techId = '';
  let orgId = '';
  let assetId = '';
  let stockItemId = '';
  let ticketId = '';
  let vendorId = '';

  beforeAll(async () => {
    await connectDB();
    await Organization.deleteMany({ code: 'MNTORG1' });
    await User.deleteMany({ email: { $regex: /maintcorp\.com/i } });

    // Register organization
    const regRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Maintenance Test Corp',
      orgCode: 'MNTORG1',
      name: 'Mnt Admin',
      email: 'admin@maintcorp.com',
      password: 'AdminPassword123!',
      assetTagPrefix: 'MTC',
    });

    adminToken = regRes.body.data.token;
    orgId = regRes.body.data.organization.id;

    // Create Technician
    const techRes = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bob HardwareTech',
        email: 'tech@maintcorp.com',
        password: 'Password123!',
        role: 'Technician',
      });
    techId = techRes.body.data.id;

    // Login Technician
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'tech@maintcorp.com',
      password: 'Password123!',
    });
    techToken = loginRes.body.data.token;

    // Setup Category, Dept, Location
    const catRes = await request(app).get('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`);
    const catId = catRes.body.data[0].id;

    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Data Center', code: 'DC' });
    const deptId = deptRes.body.data.id;

    const locRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ building: 'Server Farm', floor: 'Basement', room: 'Rack Lab' });
    const locId = locRes.body.data.id;

    // Create Asset
    const assetRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'HP Z4 G5 Workstation',
        categoryId: catId,
        manufacturer: 'HP',
        model: 'Z4 G5',
        serialNumber: 'HP-Z4-2026',
        locationId: locId,
        departmentId: deptId,
        specifications: {
          ram: {
            totalCapacityGb: 16,
            modules: [{ slot: 1, capacityGb: 16, speedMts: 4800, make: 'Crucial' }],
          },
        },
      });
    assetId = assetRes.body.data._id;
  });

  afterAll(async () => {
    if (orgId) {
      await MaintenanceRecord.deleteMany({ organizationId: orgId });
      await ComponentChange.deleteMany({ organizationId: orgId });
      await StockMovement.deleteMany({ organizationId: orgId });
      await StockItem.deleteMany({ organizationId: orgId });
      await Vendor.deleteMany({ organizationId: orgId });
      await Asset.deleteMany({ organizationId: orgId });
      await AssetCategory.deleteMany({ organizationId: orgId });
      await Department.deleteMany({ organizationId: orgId });
      await Location.deleteMany({ organizationId: orgId });
      await User.deleteMany({ organizationId: orgId });
      await Organization.deleteMany({ _id: orgId });
    }
    await disconnectDB();
  });

  it('1. POST /api/v1/stock/items registers consumable RAM inventory with opening balance 10', async () => {
    const res = await request(app)
      .post('/api/v1/stock/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemCode: 'RAM-DDR5-16G-5600',
        name: 'Kingston Fury 16GB DDR5 5600MT/s',
        category: 'RAM',
        unit: 'pcs',
        currentQuantity: 10,
        minStockLevel: 3,
        unitCostMinor: 480000, // 4,800 INR
        location: 'Store Room - Bin B4',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentQuantity).toBe(10);
    stockItemId = res.body.data._id;
  });

  it('2. POST /api/v1/stock/movements issues 2 units (OUT movement)', async () => {
    const res = await request(app)
      .post('/api/v1/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stockItemId,
        movementType: 'OUT',
        quantity: 2,
        notes: 'Dispatched 2 RAM sticks to Hardware Lab',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newQuantity).toBe(8);

    const item = await StockItem.findById(stockItemId);
    expect(item.currentQuantity).toBe(8);
  });

  it('3. Non-Negative Stock Defense: rejects OUT movement exceeding available inventory', async () => {
    const res = await request(app)
      .post('/api/v1/stock/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stockItemId,
        movementType: 'OUT',
        quantity: 15, // Only 8 available
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });

  it('4. POST /api/v1/maintenance creates repair ticket & mutates asset status to "Under Repair"', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId,
        maintenanceType: 'Hardware Upgrade',
        priority: 'High',
        issueDescription: 'Workstation running low on memory for CAD rendering; upgrade requested.',
        technicianId: techId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNumber).toMatch(/^MNT-\d{4}-\d{4}$/);
    expect(res.body.data.status).toBe('Assigned');

    ticketId = res.body.data._id;

    const asset = await Asset.findById(assetId);
    expect(asset.status).toBe('Under Repair');
  });

  it('5. POST /api/v1/maintenance/:id/component-change logs upgrade and deducts stock part', async () => {
    const res = await request(app)
      .post(`/api/v1/maintenance/${ticketId}/component-change`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        componentType: 'RAM',
        previousSpecification: '1x 16GB DDR5 4800MT/s',
        newSpecification: '2x 16GB DDR5 5600MT/s (32GB Total)',
        stockItemId,
        quantityConsumed: 1,
        updatedHardwareSpecs: {
          ram: {
            totalCapacityGb: 32,
            ddrGen: 'DDR5',
            modules: [
              { slot: 1, capacityGb: 16, speedMts: 5600, make: 'Kingston Fury' },
              { slot: 2, capacityGb: 16, speedMts: 5600, make: 'Kingston Fury' },
            ],
          },
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.componentType).toBe('RAM');

    // Verify stock deducted from 8 to 7
    const item = await StockItem.findById(stockItemId);
    expect(item.currentQuantity).toBe(7);

    // Verify Asset specs synchronized automatically (DEC-005)
    const asset = await Asset.findById(assetId);
    expect(asset.specifications.ram.totalCapacityGb).toBe(32);
    expect(asset.specifications.ram.modules.length).toBe(2);
  });

  it('6. POST /api/v1/maintenance/:id/complete closes repair and restores Asset to "Available"', async () => {
    const res = await request(app)
      .post(`/api/v1/maintenance/${ticketId}/complete`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        actionTaken: 'Installed secondary 16GB DDR5 module, ran MemTest86 for 4 passes with 0 errors.',
        costMinor: 500000,
        assetConditionPostRepair: 'Good',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Completed');

    // Verify parent asset status restored
    const asset = await Asset.findById(assetId);
    expect(asset.status).toBe('Available');
    expect(asset.condition).toBe('Good');
  });

  it('7. GET /api/v1/maintenance/:id returns ticket with full component change history', async () => {
    const res = await request(app)
      .get(`/api/v1/maintenance/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.componentChanges.length).toBe(1);
    expect(res.body.data.componentChanges[0].newSpecification).toContain('32GB Total');
  });

  it('8. POST /api/v1/vendors and POST /api/v1/purchases records hardware acquisition & warranty', async () => {
    const vRes = await request(app)
      .post('/api/v1/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dell Technologies India',
        vendorCode: 'VND-DELL',
        contactPerson: 'Karan Sharma',
        email: 'sales@dell.example.com',
        category: 'OEM',
      });

    expect(vRes.status).toBe(201);
    vendorId = vRes.body.data._id;

    const pRes = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorId,
        invoiceNumber: 'INV-2026-9901',
        purchaseDate: new Date('2026-02-01'),
        totalAmountMinor: 45000000, // 4,50,000 INR
        warrantyStartDate: new Date('2026-02-01'),
        warrantyExpiryDate: new Date('2029-02-01'),
        warrantyType: 'AMC Contract',
      });

    expect(pRes.status).toBe(201);
    expect(pRes.body.data.invoiceNumber).toBe('INV-2026-9901');
  });
});
