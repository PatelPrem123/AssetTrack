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
import { AssetAssignment } from '../src/models/AssetAssignment.js';

describe('Phase 5 & 6 - Chain of Custody & QR Code Management (DEC-003, DEC-004)', () => {
  let adminToken = '';
  let emp1Token = '';
  let emp1Id = '';
  let emp2Id = '';
  let orgId = '';
  let assetId = '';
  let activeAssignmentId = '';

  beforeAll(async () => {
    await connectDB();
    await Organization.deleteMany({ code: 'CUSTORG1' });
    await User.deleteMany({ email: { $regex: /custodycorp\.com/i } });

    // 1. Register organization
    const regRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Custody Test Corp',
      orgCode: 'CUSTORG1',
      name: 'Custody Admin',
      email: 'admin@custodycorp.com',
      password: 'AdminPassword123!',
      assetTagPrefix: 'CTC',
    });
    adminToken = regRes.body.data.token;
    orgId = regRes.body.data.organization.id;

    // 2. Create Employee 1 & Employee 2
    const emp1Res = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Employee One',
        email: 'emp1@custodycorp.com',
        password: 'Password123!',
        role: 'Employee',
      });
    emp1Id = emp1Res.body.data.id;

    const emp2Res = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Employee Two',
        email: 'emp2@custodycorp.com',
        password: 'Password123!',
        role: 'Employee',
      });
    emp2Id = emp2Res.body.data.id;

    // Login Employee 1
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'emp1@custodycorp.com',
      password: 'Password123!',
    });
    emp1Token = loginRes.body.data.token;

    // 3. Setup category, department, location
    const catsRes = await request(app).get('/api/v1/categories').set('Authorization', `Bearer ${adminToken}`);
    const catId = catsRes.body.data[0].id;

    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'IT Infrastructure', code: 'INFRA' });
    const deptId = deptRes.body.data.id;

    const locRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ building: 'Tower B', floor: 'Floor 2', room: 'Lab 201' });
    const locId = locRes.body.data.id;

    // 4. Create an available asset
    const assetRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dell Latitude 7440',
        categoryId: catId,
        manufacturer: 'Dell',
        model: 'Latitude 7440',
        serialNumber: 'DL-7440-2026',
        locationId: locId,
        departmentId: deptId,
      });
    assetId = assetRes.body.data._id;
  });

  afterAll(async () => {
    if (orgId) {
      await AssetAssignment.deleteMany({ organizationId: orgId });
      await Asset.deleteMany({ organizationId: orgId });
      await AssetCategory.deleteMany({ organizationId: orgId });
      await Department.deleteMany({ organizationId: orgId });
      await Location.deleteMany({ organizationId: orgId });
      await User.deleteMany({ organizationId: orgId });
      await Organization.deleteMany({ _id: orgId });
    }
    await disconnectDB();
  });

  it('1. POST /api/v1/assignments assigns available asset to Employee 1', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId,
        employeeId: emp1Id,
        conditionAtHandover: 'Good',
        accessories: [
          { name: '65W USB-C Charger', verified: true },
          { name: 'Dell EcoLoop Pro Backpack', verified: true },
        ],
        expectedReturnDate: new Date('2026-12-31'),
        notes: 'Assigned for enterprise remote work.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Active');
    expect(res.body.data.accessories.length).toBe(2);

    activeAssignmentId = res.body.data._id;

    // Verify Asset status mutated to 'Assigned'
    const updatedAsset = await Asset.findById(assetId);
    expect(updatedAsset.status).toBe('Assigned');
    expect(updatedAsset.assignedTo.toString()).toBe(emp1Id);
  });

  it('2. POST /api/v1/assignments rejects concurrent assignment of already assigned asset', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetId,
        employeeId: emp2Id,
        conditionAtHandover: 'Good',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/only 'available' assets can be checked out/i);
  });

  it('3. POST /api/v1/assignments/:id/transfer transfers custody directly to Employee 2', async () => {
    const res = await request(app)
      .post(`/api/v1/assignments/${activeAssignmentId}/transfer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        newEmployeeId: emp2Id,
        conditionAtHandover: 'Good',
        transferNotes: 'Reallocated to Employee Two post role transition.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeId).toBe(emp2Id);
    expect(res.body.data.status).toBe('Active');

    activeAssignmentId = res.body.data._id;

    // Verify Asset assignedTo changed
    const updatedAsset = await Asset.findById(assetId);
    expect(updatedAsset.assignedTo.toString()).toBe(emp2Id);
  });

  it('4. POST /api/v1/assignments/:id/return processes return to IT storeroom', async () => {
    const res = await request(app)
      .post(`/api/v1/assignments/${activeAssignmentId}/return`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        conditionAtReturn: 'Good',
        returnNotes: 'Device returned in clean condition with all accessories.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.status).toBe('Returned');
    expect(res.body.data.assignment.returnedAt).toBeDefined();

    // Verify Asset status reset to 'Available' and assignedTo is null
    const updatedAsset = await Asset.findById(assetId);
    expect(updatedAsset.status).toBe('Available');
    expect(updatedAsset.assignedTo).toBeNull();
  });

  it('5. Immutable Chain of Custody: Prior assignment history is completely preserved', async () => {
    const res = await request(app)
      .get(`/api/v1/assignments?assetId=${assetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2); // Assignment 1 (Transferred) + Assignment 2 (Returned)
    const statuses = res.body.data.map((a) => a.status);
    expect(statuses).toContain('Transferred');
    expect(statuses).toContain('Returned');
  });

  it('6. BOLA Defense: Regular employee only sees their own assigned device records', async () => {
    const res = await request(app)
      .get('/api/v1/assignments')
      .set('Authorization', `Bearer ${emp1Token}`);

    expect(res.status).toBe(200);
    // Employee 1 should only see records where employeeId === emp1Id
    res.body.data.forEach((item) => {
      expect(item.employeeId._id.toString()).toBe(emp1Id);
    });
  });

  it('7. GET /api/v1/assets/:id/label.pdf streams printable industrial PDF label', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/${assetId}/label.pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename="Asset-Label-');
    expect(res.body.length).toBeGreaterThan(500); // Verify binary PDF payload
  });
});
