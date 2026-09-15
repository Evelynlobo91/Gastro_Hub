import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { SubOrderEntity } from './entities/sub-order.entity';
import { PaymentEntity } from './entities/payment.entity';

/**
 * OrdersModule — Fase 2 (issue #14/#16).
 * Gestão de pedidos, subcomandas por marca/cozinha e pagamentos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, SubOrderEntity, PaymentEntity]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
