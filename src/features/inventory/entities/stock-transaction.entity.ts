import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StockMovementType } from '../../../contracts';
import { StockLevelEntity } from './stock-level.entity';

/**
 * Transação de movimentação de estoque (issue #15/#17 — Fase 2).
 *
 * Cada linha é imutável — o histórico nunca é alterado, só acrescido.
 * quantity: positivo = entrada, negativo = saída (convenção por type).
 * order_id nullable — nem toda transação origina de um pedido (ex.: compra, ajuste).
 */
@Entity('stock_transactions')
export class StockTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'stock_level_id' })
  stockLevelId: string;

  @ManyToOne(() => StockLevelEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'stock_level_id' })
  stockLevel: StockLevelEntity;

  /** FK para orders — nullable (compras, ajustes manuais não têm pedido). */
  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId: string | null;

  @Column({
    type: 'enum',
    enum: ['purchase', 'consumption', 'adjustment', 'transfer_in', 'transfer_out', 'waste'],
    enumName: 'stock_movement_type',
  })
  type: StockMovementType;

  /** Sinal por convenção de type: consumption/waste/transfer_out = negativo. */
  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity: number;

  /** Saldo do stock_level imediatamente após esta transação (snapshot). */
  @Column({ type: 'numeric', precision: 12, scale: 4, name: 'balance_after' })
  balanceAfter: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
