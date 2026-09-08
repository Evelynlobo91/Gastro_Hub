import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './cache/cache.module';
import { CryptoModule } from './common/crypto/crypto.module';
import configuration, { ThrottleConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Raiz do monólito modular Gastro_Hub (issue #4).
 *
 * Fase 0/1 entregues:
 *   - infra: config + validação de env, PostgreSQL (TypeORM), Redis, throttling
 *   - CryptoModule ...... cifragem em repouso via pgcrypto (issue #7)
 *   - CacheModule ....... cache de sessão / resiliência (issue #11)
 *   - UsersModule ....... usuários e perfis (issue #8)
 *   - AuthModule ........ cadastro, login, JWT, Argon2 (issue #7)
 *   - GatewayModule ..... roteamento, auth de requisições, health (issue #9)
 *
 * Fases seguintes plugam aqui: CatalogModule, OrdersModule, InventoryModule,
 * LoyaltyModule, DeliveryModule, MarketplaceModule (contratos em src/contracts).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const t = config.getOrThrow<ThrottleConfig>('throttle');
        return [{ ttl: t.ttl * 1000, limit: t.limit }];
      },
    }),
    DatabaseModule,
    CryptoModule,
    CacheModule,
    UsersModule,
    AuthModule,
    GatewayModule,
  ],
})
export class AppModule {}
