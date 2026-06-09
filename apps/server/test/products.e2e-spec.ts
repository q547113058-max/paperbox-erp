import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let productId: number;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // 登录获取 token
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'boss', password: 'demo' });
    token = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Products CRUD', () => {
    it('GET /api/products 200 (with token)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/products 201 (create)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'TEST-JEST-001',
          name: 'Jest 测试产品',
          spec: '100x50',
          material: '瓦楞纸',
          unit: '个',
          unit_price: 10.5,
          stock_qty: 100,
        })
        .expect(201);
      
      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBe('TEST-JEST-001');
      productId = res.body.id;
    });

    it('GET /api/products/:id 200 (find one)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(res.body.code).toBe('TEST-JEST-001');
      expect(res.body.name).toBe('Jest 测试产品');
    });

    it('PUT /api/products/:id 200 (update)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jest 测试产品 - 已更新', unit_price: 15.0 })
        .expect(200);
      
      expect(res.body.name).toBe('Jest 测试产品 - 已更新');
    });

    it('DELETE /api/products/:id 200 (delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Products Auth', () => {
    it('GET /api/products 401 (no token)', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .expect(401);
    });

    it('GET /api/products 401 (invalid token)', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
