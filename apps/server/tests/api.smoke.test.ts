import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import type { Application } from 'express';

let app: Application;
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? process.env.TEST_DEMO_PASSWORD;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

describe('API smoke tests', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/login with demo customer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
  });

  it('GET /api/v1/dashboard/customer with customer token', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/dashboard/customer')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totals).toBeDefined();
  });

  it('GET /api/v1/dashboard/admin with ops manager (no 403)', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ops@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/addresses for customer', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/addresses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/notifications for customer', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

afterAll(async () => {
  await disconnectDatabase();
});
