import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { RestaurantEntity } from '../../restaurant/restaurant.entity';

export enum SubOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Subcomanda: fatia do pedido que pertence a uma única marca/cozinha (issue #14).
 */
@Entity('sub_orders')
export class SubOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: false, name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', nullable: false, name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'restaurant_name' })
  restaurantName: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'restaurant_branch_name' })
  restaurantBranchName: string;

  @Column({ type: 'enum', enum: SubOrderStatus, default: SubOrderStatus.PENDING })
  status: SubOrderStatus;

  @Column({ type: 'integer', nullable: false, default: 0, name: 'total_amount_cents' })
  totalAmountCents: number;

  @Column({ type: 'integer', default: 0, name: 'subtotal_cents' })
  subtotalCents: number;

  @Column({ type: 'integer', default: 0, name: 'delivery_fee_cents' })
  deliveryFeeCents: number;

  /** Data estimada de preparo. */
  @Column({ type: 'timestamptz', nullable: true, name: 'estimated_ready_at' })
  estimatedReadyAt?: Date;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => RestaurantEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
