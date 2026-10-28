import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { HealthModule } from './infra/health/health.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { LoggerService } from './shared/logger/logger.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    CompaniesModule,
  ],
  providers: [
    { provide: LoggerService, useFactory: () => new LoggerService() },
  ],
  exports: [LoggerService],
})
export class AppModule {}
