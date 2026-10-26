import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module.js';
import { CompanyService } from './application/company.service.js';
import { COMPANY_REPOSITORY } from './domain/company.repository.port.js';
import { PrismaCompanyRepository } from './infrastructure/repositories/prisma-company.repo.js';
import { CompaniesController } from './presentation/companies.controller.js';
import { LoggerService } from '../../shared/logger/logger.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesController],
  providers: [
    {
      provide: LoggerService,
      useFactory: () => new LoggerService('Companies'),
    },
    CompanyService,
    PrismaCompanyRepository,
    {
      provide: COMPANY_REPOSITORY,
      useExisting: PrismaCompanyRepository,
    },
  ],
  exports: [CompanyService],
})
export class CompaniesModule {}
