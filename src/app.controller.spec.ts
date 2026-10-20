import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './infra/prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  let prismaCompany: { findMany: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prismaCompany = { findMany: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: { company: prismaCompany } },
      ],
    }).compile();

    appController = module.get(AppController);
  });

  it('should return "Hello World!"', () => {
    expect(appController.getHello()).toBe('Hello World!');
  });

  it('should list companies via prisma', async () => {
    prismaCompany.findMany.mockResolvedValue([]);
    const result = await appController.listCompanies();
    expect(result).toEqual([]);
    expect(prismaCompany.findMany).toHaveBeenCalledWith();
  });
});