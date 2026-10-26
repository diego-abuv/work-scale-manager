import { Injectable, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor(context?: string) {
    super(context ?? 'App');
  }
}
