import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { HttpExceptionFilter } from '../../shared/filters/http-exception.filter';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { AuthModule } from '../auth/auth.module';
import { HealthController } from './health.controller';

/**
 * API Gateway / BFF (issue #9).
 * Registra, na ordem, os cross-cutting concerns globais:
 *   throttling -> autenticação JWT -> autorização por papel,
 * além do filtro de erro e do log de acesso.
 */
@Module({
  imports: [TerminusModule, AuthModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class GatewayModule {}
