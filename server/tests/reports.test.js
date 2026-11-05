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

describe('Phase 10 & 11 - Dashboard Metrics & Streaming Excel/CSV Pipelines (DEC-011)', () => {
  let adminToken = '';
  let orgId = '';
  let catId = '';
  let deptId = '';
  let locId = '';

  beforeAll(async () => {
    await connectDB();
    await Organization.deleteMany({ code: 'REPORG1' });
    await User.deleteMany({ email: { $regex: /reportcorp\.com/i } });

    // Register organization
    const regRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Report Test Corp',
      orgCode: 'REPORG1',
      name: 'Report Admin',
      email: 'admin@reportcorp.com',
      password: 'AdminPassword123!',
      assetTagPrefix: 'RTC',
    });

    adminToken = regRes.body.data.token;
    orgId = regRes.body.data.organization.id;

    // Fetch seeded categories
    const catRes = await request(app).get('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`);
    catId = catRes.body.data[0].id;

    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Finance & Accounts', code: 'FIN' });
    deptId = deptRes.body.data.id;

    const locRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ building: 'Building C', floor: '1st Floor', room: 'Finance Room 101' });
    locId = locRes.body.data.id;

    // Create 2 test assets
    await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'HP LaserJet Pro M404dn',
        categoryId: catId,
        manufacturer: 'HP',
        model: 'LaserJet Pro M404dn',
        serialNumber: 'HP-PRN-001',
        locationId: locId,
        departmentId: deptId,
        purchaseCostMinor: 2500000,
        warrantyExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expiring in 30 days
      });

    await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dell UltraSharp 27 Monitor',
        categoryId: catId,
        manufacturer: 'Dell',
        model: 'U2723QE',
        serialNumber: 'DL-MON-002',
        locationId: locId,
        departmentId: deptId,
        purchaseCostMinor: 4500000,
      });
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

  it('1. GET /api/v1/dashboard/summary computes live metrics from database', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAssets).toBe(2);
    expect(res.body.data.availableAssets).toBe(2);
    expect(res.body.data.expiringWarrantiesCount).toBe(1);
    expect(res.body.data.totalAcquisitionValueMinor).toBe(7000000); // 70,000 INR
  });

  it('2. GET /api/v1/reports/categories returns category count grouping', async () => {
    const res = await request(app)
      .get('/api/v1/reports/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].count).toBe(2);
  });

  it('3. GET /api/v1/reports/status returns lifecycle status counts', async () => {
    const res = await request(app)
      .get('/api/v1/reports/status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const availableGroup = res.body.data.find((g) => g.status === 'Available');
    expect(availableGroup).toBeDefined();
    expect(availableGroup.count).toBe(2);
  });

  it('4. GET /api/v1/reports/warranty returns upcoming expiration list', async () => {
    const res = await request(app)
      .get('/api/v1/reports/warranty?days=60')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].serialNumber).toBe('HP-PRN-001');
  });

  it('5. GET /api/v1/reports/export.xlsx streams multi-sheet Excel workbook', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export.xlsx')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('attachment; filename="AssetTrack-Inventory-');
    expect(res.body.length).toBeGreaterThan(1000); // Binary Excel payload
  });

  it('6. POST /api/v1/reports/import bulk ingests CSV assets with formula sanitization', async () => {
    const csvData = `Asset Name,Manufacturer,Model,Serial Number,Category Code,Department Code,Room
Cisco Catalyst 2960 Switch,Cisco,WS-C2960-24TT-L,FCW1234567,SWT,FIN,Finance Room 101
Logitech MX Master 3S Mouse,Logitech,MX Master 3S,LZ99887766,MOU,FIN,Finance Room 101`;

    const res = await request(app)
      .post('/api/v1/reports/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvData });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.importedCount).toBe(2);
    expect(res.body.data.skippedCount).toBe(0);

    // Verify imported assets now present in inventory
    const summary = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summary.body.data.totalAssets).toBe(4);
  });
});
