import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BrandEntity } from '../../brands/brand.entity';
import { IngredientEntity } from './ingredient.entity';

/**
 * Nível de estoque de um insumo em uma marca (issue #15/#17 — Fase 2).
 *
 * UNIQUE (ingredient_id, brand_id) — um registro por insumo por marca.
 * below_minimum é coluna gerada no banco (on_hand < minimum) — não mapeada
 * como coluna TypeORM porque TypeORM não suporta GENERATED STORED diretamente;
 * é lida via query raw ou QueryBuilder quando necessário.
 */
@Check('"minimum" >= 0')
@Check('"on_hand" >= 0')
@Entity('stock_levels')
export class StockLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  @Column({ type: 'uuid', name: 'brand_id' })
  brandId: string;

  @ManyToOne(() => BrandEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  /** Quantidade disponível em estoque (na unidade base do insumo). */
  @Column({ type: 'numeric', precision: 12, scale: 4, name: 'on_hand', default: 0 })
  onHand: number;

  /** Estoque mínimo — dispara alerta quando on_hand < minimum. */
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0 })
  minimum: number;
}
