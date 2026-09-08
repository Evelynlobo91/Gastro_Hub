import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../config/configuration';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Cliente Redis compartilhado (issue #11 — cache de sessão / camada de resiliência).
 * `lazyConnect` + `maxRetriesPerRequest: 1` para que uma indisponibilidade do Redis
 * degrade em vez de derrubar a API (o consumidor trata a falha e segue via banco).
 */
export const redisProvider: FactoryProvider<Redis> = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const cfg = config.getOrThrow<RedisConfig>('redis');
    const logger = new Logger('Redis');
    const client = new Redis({
      host: cfg.host,
      port: cfg.port,
      password: cfg.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    client.on('error', (err) => logger.warn(`Redis indisponível: ${err.message}`));
    client.on('ready', () => logger.log('Redis conectado'));
    client.connect().catch(() => undefined);
    return client;
  },
};
