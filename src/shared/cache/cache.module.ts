import { Global, Module } from '@nestjs/common';
import { redisProvider } from './redis.provider';
import { SessionCacheService } from './session-cache.service';

/**
 * Módulo de cache (issue #11). Global: qualquer módulo pode injetar
 * SessionCacheService / REDIS_CLIENT sem reimportar.
 */
@Global()
@Module({
  providers: [redisProvider, SessionCacheService],
  exports: [redisProvider, SessionCacheService],
})
export class CacheModule {}
