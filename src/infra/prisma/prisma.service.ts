import { PrismaClient } from '../../generated/prisma-global/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL')!,
    });
    this.client = new PrismaClient({ adapter });
  }

  get company() {
    return this.client.company;
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
