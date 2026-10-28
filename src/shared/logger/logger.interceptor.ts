import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { LoggerService } from './logger.service.js';
// import { TenantContext } from "../tenant/tenant.context.js";

type HttpError = {
  status?: number;
  message?: string;
};

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const start = Date.now();
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    // const tenant = TenantContext.store?.companyId ?? 'n/a';
    const prefix = `[${ip}]`;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logByStatus(
            res.statusCode,
            `${method} ${url} ${res.statusCode} - ${ms}ms ${prefix}`,
          );
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const error = err as HttpError;
          const status = error?.status ?? 500;
          this.logByStatus(
            status,
            `${method} ${url} ${status} - ${ms}ms - ${error?.message ?? ''} ${prefix}`,
          );
        },
      }),
    );
  }

  private logByStatus(status: number, msg: string): void {
    if (status >= 500) this.logger.error(msg);
    else if (status >= 400) this.logger.warn(msg);
    else this.logger.log(msg);
  }
}