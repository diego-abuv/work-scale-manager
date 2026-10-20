import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './infra/prisma/prisma.service.js';

@Controller('work-scale-manager')
export class AppController {
  constructor(
    private readonly appService: AppService, 
    private readonly prisma: PrismaService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('companies')
  async listCompanies(): Promise<any[]> {
    return this.prisma.company.findMany();
  }
}
