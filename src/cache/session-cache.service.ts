import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../config/configuration';
import { SessionSnapshot } from '../contracts';
import { REDIS_CLIENT } from './redis.provider';

/**
 * Cache de sessão do usuário (issue #11).
 *
 * Guarda um snapshot leve da sessão após login e serve como allowlist rápida de
 * tokens no API Gateway. Toda operação é *best-effort*: se o Redis estiver fora,
 * o método falha em silêncio e o chamador cai no caminho do JWT/banco (resiliência).
 */
@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  private readonly ttl: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttl = config.getOrThrow<RedisConfig>('redis').sessionTtl;
  }

  private key(userId: string): string {
    return `session:${userId}`;
  }

  async save(snapshot: SessionSnapshot): Promise<void> {
    try {
      await this.redis.set(this.key(snapshot.userId), JSON.stringify(snapshot), 'EX', this.ttl);
    } catch (err) {
      this.logger.warn(`Falha ao gravar sessão no cache: ${(err as Error).message}`);
    }
  }

  async get(userId: string): Promise<SessionSnapshot | null> {
    try {
      const raw = await this.redis.get(this.key(userId));
      return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
    } catch (err) {
      this.logger.warn(`Falha ao ler sessão do cache: ${(err as Error).message}`);
      return null;
    }
  }

  async invalidate(userId: string): Promise<void> {
    try {
      await this.redis.del(this.key(userId));
    } catch (err) {
      this.logger.warn(`Falha ao invalidar sessão: ${(err as Error).message}`);
    }
  }

  /** Indica se o Redis está respondendo — usado pelo healthcheck do Gateway. */
  async isHealthy(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
