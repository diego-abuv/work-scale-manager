import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';

describe('Companies (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        company: {
          findMany: async () => [],
          findUnique: async () => null,
          create: async () => ({
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
    return request(app.getHttpServer())
      .get('/companies/c03843c5-1913-429f-9c46-574ecf64737f')
      .expect(404);
  });

  it('POST /companies cria uma empresa', () => {
    return request(app.getHttpServer())
      .post('/companies')
      .send({ name: 'ACME', slug: 'acme' })
      .expect(201)
      .expect((res) => {
        expect(res.body.slug).toBe('acme');
      });
  });

  it('POST /companies rejeita payload invalido', () => {
    return request(app.getHttpServer())
      .post('/companies')
      .send({ name: '', slug: '' })
      .expect(400);
  });
});
