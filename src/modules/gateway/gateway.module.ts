import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';
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
