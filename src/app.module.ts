import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './shared/cache/cache.module';
import { CryptoModule } from './shared/crypto/crypto.module';
import { MessagingModule } from './shared/messaging/messaging.module';
import configuration, { ThrottleConfig } from './shared/config/configuration';
import { validateEnv } from './shared/config/env.validation';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './features/auth/auth.module';
import { CatalogModule } from './features/catalog/catalog.module';
import { DeliveryModule } from './features/delivery/delivery.module';
import { InventoryModule } from './features/inventory/inventory.module';
import { MarketplaceModule } from './features/marketplace/marketplace.module';
import { OrdersModule } from './features/orders/orders.module';
import { RestaurantModule } from './features/restaurant/restaurant.module';
import { GatewayModule } from './features/gateway/gateway.module';
import { UsersModule } from './features/users/users.module';

/**
 * Raiz do monólito modular Gastro_Hub (issue #4).
 *
 * Fase 0/1 entregues:
 *   - infra: config + validação de env, PostgreSQL (TypeORM), Redis, throttling
 *   - CryptoModule ...... cifragem em repouso via pgcrypto (issue #7)
 *   - CacheModule ....... cache de sessão / resiliência (issue #11)
 *   - MessagingModule ... RabbitMQ para operações assíncronas
 *   - UsersModule ....... usuários e perfis (issue #8)
 *   - AuthModule ........ cadastro, login, JWT, Argon2 (issue #7)
 *   - GatewayModule ..... roteamento, auth de requisições, health (issue #9)
 *
 * Fase 2/3 entregues:
 *   - CatalogModule ...... marcas, categorias, produtos, cache Redis (issues #12/#13)
 *   - InventoryModule .... ingredientes, ficha técnica, estoque (issues #15/#17)
 *   - MarketplaceModule .. transferência de insumos entre marcas ACID (issues #20/#23)
 *   - OrdersModule ....... pedidos, subcomandas, pagamento (issue #14)
 *   - DeliveryModule ..... entrega e roteamento (issue #19)
 *   - RestaurantModule ... gestão de restaurantes
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
    MessagingModule,
    UsersModule,
    AuthModule,
    GatewayModule,
    RestaurantModule,
    CatalogModule,
    InventoryModule,
    MarketplaceModule,
    OrdersModule,
    DeliveryModule,
  ],
})
export class AppModule {}
