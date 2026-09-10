import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Log estruturado de acesso — observabilidade do Gateway (issue #9). */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`,
          ),
        error: (err) =>
          this.logger.warn(
            `${req.method} ${req.originalUrl} ${err?.status ?? 500} ${Date.now() - started}ms`,
          ),
      }),
    );
  }
}
