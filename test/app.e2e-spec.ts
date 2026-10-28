import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';
import { Server } from 'http';

describe('Companies (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        company: {
          findMany: () => [],
          findUnique: () => null,
          create: () => ({
            id: 'uuid-1',
            name: 'ACME',
            slug: 'acme',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /companies/:id retorna 404 quando nao existe', () => {
    const httpServer = app.getHttpServer() as unknown as Server;
    return request(httpServer)
      .get('/companies/c03843c5-1913-429f-9c46-574ecf64737f')
      .expect(404);
  });

  it('POST /companies cria uma empresa', () => {
    const httpServer = app.getHttpServer() as unknown as Server;
    return request(httpServer)
      .post('/companies')
      .send({ name: 'ACME', slug: 'acme' })
      .expect(201)
      .expect((res) => {
        expect((res.body as { slug: string }).slug).toBe('acme');
      });
  });

  it('GET /health retorna status ok', () => {
    const httpServer = app.getHttpServer() as unknown as Server;
    return request(httpServer)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe('ok');
      });
  });

  it('POST /companies rejeita payload invalido', () => {
    const httpServer = app.getHttpServer() as unknown as Server;
    return request(httpServer)
      .post('/companies')
      .send({ name: '', slug: '' })
      .expect(400);
  });
});