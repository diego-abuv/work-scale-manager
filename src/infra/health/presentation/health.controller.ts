import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}