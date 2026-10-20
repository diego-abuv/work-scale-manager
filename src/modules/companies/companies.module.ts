import { Module } from '@nestjs/common';
import { CompaniesController } from './presentation/companies.controller.js';

@Module({ controllers: [CompaniesController] })
export class CompaniesModule {}