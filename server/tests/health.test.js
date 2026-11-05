import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Phase 1 - Health & Gateway Ingress (DEC-001)', () => {
  it('GET /api/v1/health returns 200 with service metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toContain('AssetTrack');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET / returns root welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('AssetTrack');
    expect(res.body.health).toBe('/api/v1/health');
  });

  it('GET /api/v1/non-existent returns 404 with structured JSON error', async () => {
    const res = await request(app).get('/api/v1/non-existent');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Resource not found');
  });
});
