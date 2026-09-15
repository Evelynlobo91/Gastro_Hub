import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Pedido principal (carrinho unificado) da praça multimarca (issue #14).
 * Um Order pode conter SubOrders de diferentes marcas/cozinhas.
 */
@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'customer_name' })
  customerName: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'customer_phone' })
  customerPhone: string;

  @Column({ type: 'text', nullable: true, name: 'customer_address' })
  customerAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'delivery_instructions' })
  deliveryInstructions?: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Total do pedido em centavos. */
  @Column({ type: 'integer', nullable: false, default: 0, name: 'total_amount_cents' })
  totalAmountCents: number;

  /** Taxa de entrega em centavos. */
  @Column({ type: 'integer', nullable: false, default: 0, name: 'delivery_fee_cents' })
  deliveryFeeCents: number;

  /** Subtotal dos itens (sem entrega) em centavos. */
  @Column({ type: 'integer', default: 0, name: 'subtotal_cents' })
  subtotalCents: number;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true, name: 'restaurant_branch_id' })
  restaurantBranchId?: string;

  /** Data estimada de entrega. */
  @Column({ type: 'timestamptz', nullable: true, name: 'estimated_delivery_at' })
  estimatedDeliveryAt?: Date;

  @ManyToOne(() => UserEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
