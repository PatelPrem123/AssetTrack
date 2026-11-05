import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Organization } from '../src/models/Organization.js';
import { User } from '../src/models/User.js';
import { AssetCategory } from '../src/models/AssetCategory.js';
import { Department } from '../src/models/Department.js';
import { Location } from '../src/models/Location.js';

describe('Phase 3 - Categories, Departments & Locations Taxonomy (DEC-007)', () => {
  let adminToken = '';
  let employeeToken = '';
  let orgId = '';

  beforeAll(async () => {
    await connectDB();
    await Organization.deleteMany({ code: 'TAXORG1' });
    await User.deleteMany({ email: { $regex: /taxonomycorp\.com/i } });

    // Register organization
    const regRes = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Taxonomy Corp',
      orgCode: 'TAXORG1',
      name: 'Tax Admin',
      email: 'admin@taxonomycorp.com',
      password: 'AdminPassword123!',
    });

    adminToken = regRes.body.data.token;
    orgId = regRes.body.data.organization.id;

    // Create an employee
    await request(app)
      .post('/api/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regular Emp',
        email: 'emp@taxonomycorp.com',
        password: 'EmpPassword123!',
        role: 'Employee',
      });

    // Login employee
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'emp@taxonomycorp.com',
      password: 'EmpPassword123!',
    });
    employeeToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await Organization.deleteMany({ code: 'TAXORG1' });
    await User.deleteMany({ email: { $regex: /taxonomycorp\.com/i } });
    if (orgId) {
      await AssetCategory.deleteMany({ organizationId: orgId });
      await Department.deleteMany({ organizationId: orgId });
      await Location.deleteMany({ organizationId: orgId });
    }
    await disconnectDB();
  });

  it('1. GET /api/v1/categories auto-seeds 14 default categories', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(14);
    const names = res.body.data.map((c) => c.name);
    expect(names).toContain('Laptops');
    expect(names).toContain('Desktop Computers');
    expect(names).toContain('Network Switches');
    expect(names).toContain('RAM Modules');
  });

  it('2. POST /api/v1/categories creates custom category', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Firewalls & UTMs',
        code: 'FWL',
        isHardware: true,
        description: 'Next-gen enterprise firewalls',
        defaultDepreciationYears: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Firewalls & UTMs');
    expect(res.body.data.code).toBe('FWL');
  });

  it('3. POST /api/v1/categories blocks duplicate code', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Another Firewall',
        code: 'FWL', // Duplicate code
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('4. POST /api/v1/departments creates new corporate department', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Information Technology',
        code: 'IT',
        headOfDepartment: 'Robert Vance',
        contactEmail: 'it.helpdesk@taxonomycorp.com',
        budgetMinor: 500000000, // 50,00,000 INR in paise
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Information Technology');
    expect(res.body.data.code).toBe('IT');
  });

  it('5. POST /api/v1/locations creates physical campus location', async () => {
    const res = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        campus: 'Headquarters',
        building: 'Tech Tower',
        floor: 'Floor 3',
        room: 'Lab 301',
        capacity: 40,
        isServerRoom: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.building).toBe('Tech Tower');
    expect(res.body.data.room).toBe('Lab 301');
    expect(res.body.data.name).toContain('Tech Tower • Floor 3 • Lab 301');
  });

  it('6. POST /api/v1/locations prevents duplicate room on same building & floor', async () => {
    const res = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        campus: 'Headquarters',
        building: 'Tech Tower',
        floor: 'Floor 3',
        room: 'Lab 301', // Duplicate
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('7. Employee role is blocked from creating categories (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Unauthorized Category',
        code: 'UNAUTH',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
