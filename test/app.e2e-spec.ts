import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ company: { findMany: async () => [] } })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /work-scale-manager', () => {
    return request(app.getHttpServer())
      .get('/work-scale-manager')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /work-scale-manager/companies', () => {
    return request(app.getHttpServer())
      .get('/work-scale-manager/companies')
      .expect(200)
      .expect([]);
  });
});