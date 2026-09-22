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
import { ProductEntity } from '../../catalog/entities/product.entity';

/**
 * Item de um pedido — referencia um produto do catálogo (issue #14).
 * Preços são copiados no momento do pedido para preservar histórico.
 */
@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: false, name: 'order_id' })
  orderId: string;

  @Index()
  @Column({ type: 'uuid', nullable: false, name: 'product_id' })
  productId: string;

  /** Nome do produto no momento do pedido (snapshot). */
  @Column({ type: 'varchar', length: 255, nullable: false, name: 'product_name' })
  productName: string;

  /** Preço unitário no momento do pedido em centavos. */
  @Column({ type: 'integer', nullable: false, name: 'unit_price_cents' })
  unitPriceCents: number;

  @Column({ type: 'integer', nullable: false })
  quantity: number;

  /** Subtotal = quantity * unit_price_cents. */
  @Column({ type: 'integer', nullable: false, name: 'subtotal_cents' })
  subtotalCents: number;

  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions?: string;

  @Column({ type: 'jsonb', nullable: true })
  customizations?: Record<string, unknown>;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => ProductEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
