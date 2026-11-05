import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';

describe('Phase 2 - Authentication & Multi-Tenant Organization Management (DEC-007, DEC-008)', () => {
  beforeAll(async () => {
    await connectDB();
    // Clean test collections
    await Organization.deleteMany({ code: { $in: ['TESTORG1', 'TESTORG2'] } });
    await User.deleteMany({ email: { $regex: /testitcorp\.com|secondorg\.com/i } });
  });

  afterAll(async () => {
    await Organization.deleteMany({ code: { $in: ['TESTORG1', 'TESTORG2'] } });
    await User.deleteMany({ email: { $regex: /testitcorp\.com|secondorg\.com/i } });
    await disconnectDB();
  });

  let adminToken = '';
  let employeeToken = '';
  let org1Id = '';

  it('1. POST /api/v1/auth/register registers new organization and root Admin', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Test IT Corp',
      orgCode: 'TESTORG1',
      name: 'Root Admin',
      email: 'admin@testitcorp.com',
      password: 'AdminPassword123!',
      assetTagPrefix: 'TIT',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.organization.code).toBe('TESTORG1');
    expect(res.body.data.user.role).toBe('Admin');
    expect(res.body.data).toHaveProperty('token');

    adminToken = res.body.data.token;
    org1Id = res.body.data.organization.id;

    // Verify audit log entry
    const log = await AuditLog.findOne({ organizationId: org1Id, action: 'ORGANIZATION_REGISTERED' });
    expect(log).toBeDefined();
    expect(log.action).toBe('ORGANIZATION_REGISTERED');
  });

  it('2. POST /api/v1/auth/register rejects duplicate organization code', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Another Corp',
      orgCode: 'TESTORG1', // Duplicate code
      name: 'Another Admin',
      email: 'another@corp.com',
      password: 'AdminPassword123!',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already taken/i);
  });

  it('3. POST /api/v1/auth/login authenticates with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@testitcorp.com',
      password: 'AdminPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@testitcorp.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('4. POST /api/v1/auth/login rejects invalid password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@testitcorp.com',
      password: 'WrongPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('5. GET /api/v1/auth/me returns authenticated user & org context', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@testitcorp.com');
    expect(res.body.data.user.role).toBe('Admin');
    expect(res.body.data.user.organizationCode).toBe('TESTORG1');
  });

  it('6. GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('7. POST /api/v1/auth/users allows Admin to create a Technician and Employee', async () => {
    // Create Technician
    const techRes = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Tech',
        email: 'john.tech@testitcorp.com',
        password: 'TechPassword123!',
        role: 'Technician',
        employeeId: 'EMP-TECH-01',
      });

    expect(techRes.status).toBe(201);
    expect(techRes.body.data.role).toBe('Technician');

    // Create Employee
    const empRes = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alice Employee',
        email: 'alice.emp@testitcorp.com',
        password: 'EmpPassword123!',
        role: 'Employee',
        employeeId: 'EMP-DEV-01',
      });

    expect(empRes.status).toBe(201);
    expect(empRes.body.data.role).toBe('Employee');

    // Login as Employee to get employee token
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'alice.emp@testitcorp.com',
      password: 'EmpPassword123!',
    });
    employeeToken = loginRes.body.data.token;
  });

  it('8. POST /api/v1/auth/users blocks Employee from creating users (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Hacker User',
        email: 'hack@testitcorp.com',
        password: 'HackPassword123!',
        role: 'Admin',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Access denied/i);
  });

  it('9. Multi-Tenant Isolation: Org B cannot see or access Org A users', async () => {
    // Register Organization B
    const orgBRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Second Org Ltd',
      orgCode: 'TESTORG2',
      name: 'Org B Admin',
      email: 'admin@secondorg.com',
      password: 'AdminPassword123!',
    });
    const orgBToken = orgBRes.body.data.token;

    // List users as Org B Admin
    const listRes = await request(app)
      .get('/api/v1/auth/users')
      .set('Authorization', `Bearer ${orgBToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.count).toBe(1); // Only Org B admin
    const emails = listRes.body.data.map((u) => u.email);
    expect(emails).not.toContain('admin@testitcorp.com');
    expect(emails).not.toContain('john.tech@testitcorp.com');
    expect(emails).not.toContain('alice.emp@testitcorp.com');
  });
});
