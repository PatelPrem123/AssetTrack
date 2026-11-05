import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { Asset } from '../src/models/Asset.js';
import { AssetCategory } from '../src/models/AssetCategory.js';
import { StockItem } from '../src/models/StockItem.js';
import { Notification } from '../src/models/Notification.js';
import { Department } from '../src/models/Department.js';
import { Location } from '../src/models/Location.js';

describe('Phase 12 - Security Hardening & Background Schedulers (DEC-007, DEC-012)', () => {
  let orgAToken, orgBToken, employeeToken;
  let orgAId, orgBId;
  let categoryId, departmentId, locationId;
  let createdNotificationId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/assettrack');
    }

    await Organization.deleteMany({ code: { $in: ['SECA', 'SECB'] } });
    await User.deleteMany({ email: { $regex: /sec-(a|b|emp)@test\.com/i } });
    await Notification.deleteMany({});

    // 1. Setup Org A
    const orgARes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Security Corp A',
      orgCode: 'SECA',
      name: 'Sec Admin',
      email: 'sec-a@test.com',
      password: 'SecPassword123!',
      assetTagPrefix: 'SCA',
    });
    orgAToken = orgARes.body.data.token;
    orgAId = orgARes.body.data.organization.id;

    // 2. Setup Org B
    const orgBRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Security Corp B',
      orgCode: 'SECB',
      name: 'Sec Admin B',
      email: 'sec-b@test.com',
      password: 'SecPassword123!',
      assetTagPrefix: 'SCB',
    });
    orgBToken = orgBRes.body.data.token;
    orgBId = orgBRes.body.data.organization.id;

    // 3. Setup Employee under Org A
    await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Sec Employee',
        email: 'sec-emp@test.com',
        password: 'EmployeePass123!',
        role: 'Employee',
        employeeId: 'EMP-SEC-01',
      });

    const empLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'sec-emp@test.com',
      password: 'EmployeePass123!',
    });
    employeeToken = empLoginRes.body.data.token;

    // Seed and fetch categories
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${orgAToken}`);
    categoryId = catRes.body.data[0].id || catRes.body.data[0]._id;

    // Setup Department & Location
    const deptRes = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ name: 'SecOps Department', code: 'SECOPS' });
    departmentId = deptRes.body.data.id || deptRes.body.data._id;

    const locRes = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({ building: 'SecOps Bunker', floor: 'Floor B1', room: 'Vault 01' });
    locationId = locRes.body.data.id || locRes.body.data._id;
  });

  afterAll(async () => {
    if (orgAId) {
      await Asset.deleteMany({ organizationId: orgAId });
      await StockItem.deleteMany({ organizationId: orgAId });
      await Notification.deleteMany({ organizationId: orgAId });
      await Department.deleteMany({ organizationId: orgAId });
      await Location.deleteMany({ organizationId: orgAId });
      await AssetCategory.deleteMany({ organizationId: orgAId });
      await User.deleteMany({ organizationId: orgAId });
      await Organization.deleteMany({ _id: orgAId });
    }
    if (orgBId) {
      await Notification.deleteMany({ organizationId: orgBId });
      await User.deleteMany({ organizationId: orgBId });
      await Organization.deleteMany({ _id: orgBId });
    }
  });

  it('1. NoSQL Injection Defense: Malicious operator payload in login is rejected by Zod validation', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: { $gt: '' },
      password: { $gt: '' },
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Validation');
  });

  it('2. RBAC Enforcement: Standard Employee cannot trigger audit scans', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/audit')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. Warranty & Stock Audit: Creates proactive alerts for expiring warranty and low stock', async () => {
    const now = new Date();
    const expirySoon = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 days out

    // Create asset nearing warranty in Org A
    const assetRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        name: 'Core Security Firewall',
        categoryId,
        manufacturer: 'Fortinet',
        model: 'FortiGate 100F',
        serialNumber: 'FG100F-SEC-2026',
        locationId,
        departmentId,
        warrantyExpiry: expirySoon,
      });

    expect(assetRes.status).toBe(201);

    // Create low stock consumable in Org A
    const stockRes = await request(app)
      .post('/api/v1/stock/items')
      .set('Authorization', `Bearer ${orgAToken}`)
      .send({
        itemCode: 'SEC-SSD-1TB',
        name: 'Samsung 990 PRO 1TB NVMe',
        category: 'SSD',
        unit: 'pcs',
        currentQuantity: 1, // Below min stock of 5
        minStockLevel: 5,
        unitCostMinor: 1100000,
        location: 'SecOps Bin 1',
      });

    expect(stockRes.status).toBe(201);

    // Trigger Audit scan via API
    const scanRes = await request(app)
      .post('/api/v1/notifications/audit')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.success).toBe(true);
    expect(scanRes.body.data.notificationsCreated).toBeGreaterThanOrEqual(2);

    // Verify notifications returned in list
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
    expect(listRes.body.unreadCount).toBeGreaterThanOrEqual(2);

    createdNotificationId = listRes.body.data[0]._id;
  });

  it('4. Notification Deduplication: Re-running audit within 24h does not create duplicate alerts', async () => {
    const scanRes = await request(app)
      .post('/api/v1/notifications/audit')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(scanRes.status).toBe(200);
    // Already scanned today for the same assets, so 0 new notifications
    expect(scanRes.body.data.notificationsCreated).toBe(0);
  });

  it('5. Multi-Tenant BOLA Isolation: Org B cannot see or mark Org A notifications', async () => {
    // Org B queries notifications -> should be empty
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(0);

    // Org B attempts to mark Org A notification as read
    const patchRes = await request(app)
      .patch(`/api/v1/notifications/${createdNotificationId}/read`)
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(patchRes.status).toBe(404);
  });

  it('6. Lifecycle & Read Status: Admin marks single and batch notifications as read', async () => {
    // Mark single notification as read
    const singleRes = await request(app)
      .patch(`/api/v1/notifications/${createdNotificationId}/read`)
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.data.isRead).toBe(true);

    // Mark all as read
    const allRes = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(allRes.status).toBe(200);

    // Verify unread count is now 0
    const listRes = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${orgAToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.unreadCount).toBe(0);
    expect(listRes.body.data.length).toBe(0);
  });
});
