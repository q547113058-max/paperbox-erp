import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Paperbox ERP API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login 401 (no credentials)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({})
      .expect(401);
  });

  it('POST /api/auth/login 401 (wrong password)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'boss', password: 'wrong' })
      .expect(401);
  });

  it('POST /api/auth/login 200 (correct credentials) → access_token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'boss', password: 'demo' })
      .expect(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.role).toBe('boss');
    token = res.body.access_token;
  });

  it('GET /api/products 401 (no token)', () => {
    return request(app.getHttpServer()).get('/api/products').expect(401);
  });

  it('GET /api/products 200 (with token) → array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/customers 200 (with token) → array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/orders 200 (with token) → array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/orders 401 (expired/invalid token)', () => {
    return request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });
});
