import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { SessionCacheService } from '../../shared/cache/session-cache.service';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('gateway')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly sessions: SessionCacheService,
  ) {}

  @Public()
  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness/readiness do Gateway (issue #9)' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('postgres', { timeout: 1500 }),
      // Redis é camada de resiliência (issue #11): reportamos o alcance sem
      // derrubar o readiness quando ele está fora.
      async () => ({ redis: { status: 'up', reachable: await this.sessions.isHealthy() } }),
    ]);
  }

  @Public()
  @Get()
  root() {
    return { service: 'gastro-hub', status: 'ok' };
  }
}
