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

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  ONLINE_TRANSFER = 'ONLINE_TRANSFER',
}

/**
 * Pagamento vinculado a um pedido (issue #14).
 */
@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: false, name: 'order_id' })
  orderId: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: false, name: 'payment_method' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /** Valor total em centavos. */
  @Column({ type: 'integer', nullable: false, name: 'amount_cents' })
  amountCents: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_id' })
  transactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_gateway' })
  paymentGateway?: string;

  @Column({ type: 'text', nullable: true, name: 'payment_data' })
  paymentData?: string;

  @Column({ type: 'varchar', length: 4, nullable: true, name: 'card_last_four' })
  cardLastFour?: string;

  @Column({ type: 'integer', default: 0, name: 'refund_amount_cents' })
  refundAmountCents: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'paid_at' })
  paidAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'refunded_at' })
  refundedAt?: Date;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
