import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { LoggerService } from './shared/logger/logger.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(LoggerService));
  const trustProxy = process.env.TRUST_PROXY === 'true' ? true : false;
  app.set('trust proxy', trustProxy);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
