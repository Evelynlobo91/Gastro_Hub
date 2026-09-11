import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, redisProvider } from './redis.provider';
import { SessionCacheService } from './session-cache.service';

/**
 * Módulo de cache (issue #11). Global: qualquer módulo pode injetar
 * SessionCacheService / REDIS_CLIENT sem reimportar.
 *
 * Fecha a conexão Redis em `onModuleDestroy` — sem isso o socket fica aberto
 * após `app.close()` e prende o processo (Jest nunca sai sozinho nos e2e).
 */
@Global()
@Module({
  providers: [redisProvider, SessionCacheService],
  exports: [redisProvider, SessionCacheService],
})
export class CacheModule implements OnModuleDestroy {
  private readonly logger = new Logger(CacheModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (err) {
      this.logger.warn(
        `Falha ao encerrar conexão Redis, forçando disconnect: ${(err as Error).message}`,
      );
      this.redis.disconnect();
    }
  }
}
