import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity } from '../../orders/entities/order.entity';
import { DeliveryZoneEntity } from './delivery-zone.entity';

// Re-exporta FulfillmentType para não quebrar imports externos
export { FulfillmentType } from '../../orders/enums/fulfillment-type.enum';
import { FulfillmentType } from '../../orders/enums/fulfillment-type.enum';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('deliveries')
export class DeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', nullable: true, name: 'restaurant_id' })
  restaurantId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'courier_id' })
  courierId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'courier_name' })
  courierName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'courier_phone' })
  courierPhone?: string;

  @Column({
    type: 'enum',
    enum: FulfillmentType,
    default: FulfillmentType.DELIVERY,
    name: 'fulfillment_type',
  })
  fulfillmentType: FulfillmentType;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'integer', default: 0, name: 'delivery_fee_cents' })
  deliveryFeeCents: number;

  @Column({ type: 'text', nullable: true, name: 'delivery_address' })
  deliveryAddress?: string;

  @Column({ type: 'uuid', nullable: true, name: 'delivery_region_id' })
  deliveryRegionId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'table_number' })
  tableNumber?: string;

  @Column({ type: 'boolean', default: false, name: 'pickup_notice_sent' })
  pickupNoticeSent: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'assigned_at' })
  assignedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'picked_up_at' })
  pickedUpAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => DeliveryZoneEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'delivery_region_id' })
  deliveryZone?: DeliveryZoneEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
