import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryZoneEntity } from './entities/delivery-zone.entity';
import { DeliveryEntity } from './entities/delivery.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MessagingModule } from '../../shared/messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryZoneEntity, DeliveryEntity]),
    MessagingModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
