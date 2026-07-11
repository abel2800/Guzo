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

afterAll(async () => {
  await disconnectDatabase();
});

describe('OTP API', () => {
  it('POST /otp/send returns success', async () => {
    const res = await request(app).post('/api/v1/otp/send').send({ phone: '0911223344' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /otp/verify rejects wrong code', async () => {
    await request(app).post('/api/v1/otp/send').send({ phone: '0911334455' });
    const res = await request(app).post('/api/v1/otp/verify').send({ phone: '0911334455', code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Family API', () => {
  it('GET /family/:id requires auth', async () => {
    const res = await request(app).get('/api/v1/family/user_test');
    expect(res.status).toBe(401);
  });

  it('GET /family/:id returns list for customer', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    const userId = me.body.data.id;

    const res = await request(app)
      .get(`/api/v1/family/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Push tokens API', () => {
  it('POST /push-tokens registers device', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@delivery.local', password: DEMO_PASSWORD });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .post('/api/v1/push-tokens')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: 'ExponentPushToken[test-token]', platform: 'android', appSlug: 'customer' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
