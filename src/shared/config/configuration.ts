/**
 * Configuração central da aplicação (issue #4).
 * Lê variáveis de ambiente e expõe um objeto tipado via @nestjs/config.
 */
export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  ssl: boolean;
  encryptionKey: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  sessionTtl: number;
}

export interface JwtConfig {
  accessSecret: string;
  accessTtl: number;
  refreshSecret: string;
  refreshTtl: number;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: toNumber(process.env.PORT, 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    apiVersion: process.env.API_VERSION ?? 'v1',
  } satisfies AppConfig,
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    user: process.env.DB_USER ?? 'gastrohub',
    password: process.env.DB_PASSWORD ?? 'gastrohub',
    name: process.env.DB_NAME ?? 'gastrohub',
    ssl: process.env.DB_SSL === 'true',
    encryptionKey: process.env.DB_ENCRYPTION_KEY ?? 'dev-only-change-me-0123456789abcdef',
  } satisfies DatabaseConfig,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    sessionTtl: toNumber(process.env.REDIS_SESSION_TTL, 3600),
  } satisfies RedisConfig,
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://gastrohub:gastrohub@localhost:5672',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    accessTtl: toNumber(process.env.JWT_ACCESS_TTL, 900),
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    refreshTtl: toNumber(process.env.JWT_REFRESH_TTL, 1209600),
  } satisfies JwtConfig,
  throttle: {
    ttl: toNumber(process.env.THROTTLE_TTL, 60),
    limit: toNumber(process.env.THROTTLE_LIMIT, 120),
  } satisfies ThrottleConfig,
});
