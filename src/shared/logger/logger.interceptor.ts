import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from './logger.service.js';
// import { TenantContext } from "../tenant/tenant.context.js";

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const start = Date.now();
    const ip = req.ip ?? req.socket?.remoteAddress;
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
        error: (err) => {
          const ms = Date.now() - start;
          const status = err?.status ?? 500;
          this.logByStatus(
            status,
            `${method} ${url} ${status} - ${ms}ms - ${err?.message} ${prefix}`,
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
