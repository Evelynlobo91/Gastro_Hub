import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from '../../brands/brand.entity';
import { IngredientEntity } from '../../inventory/entities/ingredient.entity';

/**
 * Transferência de insumo entre marcas — Marketplace interno (issues #20/#23 — Fase 3).
 *
 * Regras de negócio garantidas no banco (CHECK):
 *   - from_brand_id <> to_brand_id (não pode transferir para si mesmo)
 *   - quantity > 0
 *   - transfer_price_cents > unit_cost_cents (regra central do projeto:
 *     o preço de transferência deve ser maior que o custo de aquisição)
 */
@Check('"from_brand_id" <> "to_brand_id"')
@Check('"quantity" > 0')
@Check('"transfer_price_cents" > "unit_cost_cents"')
@Entity('brand_transfers')
export class BrandTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'from_brand_id' })
  fromBrandId: string;

  @ManyToOne(() => BrandEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'from_brand_id' })
  fromBrand: BrandEntity;

  @Column({ type: 'uuid', name: 'to_brand_id' })
  toBrandId: string;

  @ManyToOne(() => BrandEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'to_brand_id' })
  toBrand: BrandEntity;

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  /** Quantidade transferida na unidade base do insumo. */
  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity: number;

  /** Custo de aquisição do insumo para a marca origem (centavos). */
  @Column({ type: 'int', name: 'unit_cost_cents' })
  unitCostCents: number;

  /**
   * Preço de transferência cobrado da marca destino (centavos).
   * CHECK: deve ser maior que unit_cost_cents.
   */
  @Column({ type: 'int', name: 'transfer_price_cents' })
  transferPriceCents: number;

  @Column({
    type: 'enum',
    enum: ['requested', 'approved', 'shipped', 'received', 'rejected'],
    enumName: 'brand_transfer_status',
    default: 'requested',
  })
  status: 'requested' | 'approved' | 'shipped' | 'received' | 'rejected';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
