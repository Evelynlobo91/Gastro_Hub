import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './shared/cache/cache.module';
import { CryptoModule } from './shared/crypto/crypto.module';
import configuration, { ThrottleConfig } from './shared/config/configuration';
import { validateEnv } from './shared/config/env.validation';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './features/auth/auth.module';
import { GatewayModule } from './features/gateway/gateway.module';
import { UsersModule } from './features/users/users.module';
import { CatalogModule } from './features/catalog/catalog.module';
import { OrdersModule } from './features/orders/orders.module';
import { RestaurantModule } from './features/restaurant/restaurant.module';
import { InventoryModule } from './features/inventory/inventory.module';

/**
 * Módulo principal do Gastro_Hub.
 * Registra a infraestrutura global (config, database, cache, crypto)
 * e os módulos funcionais da aplicação.
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
    RestaurantModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
  ],
})
export class AppModule {}
