import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantEntity } from './restaurant.entity';

/**
 * RestaurantModule — Gestão de restaurantes parceiros (issue #14).
 * Entidade necessária para SubOrders do módulo de pedidos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([RestaurantEntity])],
  exports: [TypeOrmModule],
})
export class RestaurantModule {}
