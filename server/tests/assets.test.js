import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { AssetCategory } from '../src/models/AssetCategory.js';
import { Department } from '../src/models/Department.js';
import { Location } from '../src/models/Location.js';
import { Asset } from '../src/models/Asset.js';

describe('Phase 4 - Asset Registration & Granular Hardware Specifications (DEC-002, DEC-004)', () => {
  let adminToken = '';
  let employeeToken = '';
  let orgId = '';
  let categoryId = '';
  let deptId = '';
  let locationId = '';
  let registeredAssetId = '';
  let registeredQRRef = '';

  beforeAll(async () => {
    await connectDB();
    await Organization.deleteMany({ code: 'ASSTORG1' });
    await User.deleteMany({ email: { $regex: /assetcorp\.com/i } });

    // Register organization
    const regRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Asset Test Corp',
      orgCode: 'ASSTORG1',
      name: 'Asset Admin',
      email: 'admin@assetcorp.com',
      password: 'AdminPassword123!',
      assetTagPrefix: 'ATC',
    });

    adminToken = regRes.body.data.token;
    orgId = regRes.body.data.organization.id;

    // Create and login employee
    await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Desk Employee',
        email: 'emp@assetcorp.com',
        password: 'EmpPassword123!',
        role: 'Employee',
      });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'emp@assetcorp.com',
      password: 'EmpPassword123!',
    });
    employeeToken = loginRes.body.data.token;

    // Fetch or create category, department, location
    const catsRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    const laptopCat = catsRes.body.data.find((c) => c.name === 'Laptops');
    categoryId = laptopCat.id;

    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Software Engineering',
        code: 'SWE',
      });
    deptId = deptRes.body.data.id;

    const locRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        building: 'Silicon Block',
        floor: '4th Floor',
        room: 'Dev Bay 402',
      });
    locationId = locRes.body.data.id;
  });

  afterAll(async () => {
    if (orgId) {
      await Asset.deleteMany({ organizationId: orgId });
      await AssetCategory.deleteMany({ organizationId: orgId });
      await Department.deleteMany({ organizationId: orgId });
      await Location.deleteMany({ organizationId: orgId });
      await User.deleteMany({ organizationId: orgId });
      await Organization.deleteMany({ _id: orgId });
    }
    await disconnectDB();
  });

  it('1. POST /api/v1/assets registers laptop with deep structured hardware specs', async () => {
    const payload = {
      name: 'ThinkPad P16 Gen 2 Mobile Workstation',
      categoryId,
      manufacturer: 'Lenovo',
      model: 'ThinkPad P16 Gen 2',
      serialNumber: 'PF-4X998A-2026',
      condition: 'New',
      locationId,
      departmentId: deptId,
      purchaseDate: new Date('2026-01-15'),
      purchaseCostMinor: 18500000, // 1,85,000 INR
      warrantyExpiry: new Date('2029-01-15'),
      specifications: {
        cpu: {
          manufacturer: 'Intel',
          model: 'Core i7-13700HX',
          generation: '13th Gen Raptor Lake',
          cores: 16,
          threads: 24,
          baseGhz: 2.1,
          boostGhz: 5.0,
        },
        ram: {
          totalCapacityGb: 32,
          ddrGen: 'DDR5',
          formFactor: 'SODIMM',
          modules: [
            { slot: 1, capacityGb: 16, speedMts: 5600, make: 'Samsung', serial: 'SAM-5600-01' },
            { slot: 2, capacityGb: 16, speedMts: 5600, make: 'Samsung', serial: 'SAM-5600-02' },
          ],
        },
        storage: {
          drives: [
            {
              driveIndex: 0,
              driveType: 'SSD',
              interface: 'NVMe',
              capacityGb: 1024,
              make: 'Samsung',
              model: 'PM9A1 Gen4',
              serial: 'S6B0NS0W1',
              healthStatus: 'Good',
            },
          ],
        },
        gpu: {
          gpuType: 'Dedicated',
          manufacturer: 'NVIDIA',
          model: 'RTX A2000 Ada Generation',
          dedicatedVramGb: 8,
        },
        networking: {
          ethernetMac: '00:1A:2B:3C:4D:5E',
          wifiMac: 'AA:BB:CC:DD:EE:FF',
          linkSpeedMbps: 2500,
          connectionType: 'DHCP',
        },
        os: {
          osName: 'Windows 11 Pro',
          edition: 'Professional',
          version: '23H2',
          architecture: 'x64',
          buildNumber: '22631.3296',
        },
      },
    };

    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assetTag).toMatch(/^ATC-\d{4}-\d{4}$/); // Auto-generated tag
    expect(res.body.data.qrCodeReference).toContain('Q-ASSTORG1-');
    expect(res.body.data.status).toBe('Available');
    expect(res.body.data.specifications.cpu.cores).toBe(16);
    expect(res.body.data.specifications.ram.modules.length).toBe(2);

    registeredAssetId = res.body.data._id;
    registeredQRRef = res.body.data.qrCodeReference;
  });

  it('2. POST /api/v1/assets prevents duplicate serial number within organization', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Serial Machine',
        categoryId,
        manufacturer: 'Lenovo',
        model: 'ThinkPad P16',
        serialNumber: 'PF-4X998A-2026', // Same serial
        locationId,
        departmentId: deptId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/serial number.*already registered/i);
  });

  it('3. GET /api/v1/assets returns paginated asset inventory with filters', async () => {
    const res = await request(app)
      .get(`/api/v1/assets?categoryId=${categoryId}&status=Available`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].assetTag).toBeDefined();
    expect(res.body.pagination).toBeDefined();
  });

  it('4. GET /api/v1/assets/:id returns deep hardware specs', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/${registeredAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('ThinkPad P16 Gen 2 Mobile Workstation');
    expect(res.body.data.specifications.ram.totalCapacityGb).toBe(32);
    expect(res.body.data.specifications.storage.drives[0].interface).toBe('NVMe');
  });

  it('5. GET /api/v1/assets/:id/qr returns printable SVG and PNG barcode', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/${registeredAssetId}/qr`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('qrDataUrl');
    expect(res.body.data).toHaveProperty('qrSvg');
    expect(res.body.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.qrSvg).toContain('<svg');
  });

  it('6. GET /api/v1/assets/scan/:qrRef serves role-tailored view for Employee', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/scan/${registeredQRRef}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assetTag).toBeDefined();
    expect(res.body.data.allowReportMalfunction).toBe(true);
    // Sensitive specs omitted for standard Employee scan (DEC-004)
    expect(res.body.data.specifications).toBeUndefined();
  });

  it('7. GET /api/v1/assets/scan/:qrRef serves full diagnostic specs for Admin', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/scan/${registeredQRRef}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.specifications).toBeDefined();
    expect(res.body.data.specifications.cpu.model).toBe('Core i7-13700HX');
  });

  it('8. PATCH /api/v1/assets/:id updates asset metadata and notes', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${registeredAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        condition: 'Good',
        notes: 'Asset deployed in Dev Bay 402 with anti-theft cable lock.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.condition).toBe('Good');
    expect(res.body.data.notes).toContain('anti-theft cable lock');
  });

  it('9. POST /api/v1/assets/:id/retire retires available asset', async () => {
    const res = await request(app)
      .post(`/api/v1/assets/${registeredAssetId}/retire`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'End of hardware lease agreement',
        disposalMethod: 'Storage',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Retired');
  });
});
