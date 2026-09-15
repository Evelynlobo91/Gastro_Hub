import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from '../../brands/brand.entity';

/**
 * Insumo / ingrediente usado na ficha técnica dos produtos (issue #15 — Fase 2).
 *
 * brand_id nullable → insumo compartilhável entre marcas (ex.: sal, óleo).
 * brand_id preenchido → insumo exclusivo da marca (ex.: molho secreto).
 *
 * base_unit: 'g' | 'ml' | 'un' — unidade base usada em recipe_components e stock_levels.
 */
@Entity('ingredients')
export class IngredientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nulo = insumo compartilhado por todas as marcas. */
  @Column({ type: 'uuid', name: 'brand_id', nullable: true })
  brandId: string | null;

  @ManyToOne(() => BrandEntity, { onDelete: 'CASCADE', eager: false, nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity | null;

  @Column({ type: 'text' })
  name: string;

  /** Unidade base do insumo: 'g', 'ml' ou 'un'. */
  @Column({ type: 'text', name: 'base_unit' })
  baseUnit: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relações inversas declaradas via string para evitar dependência circular.
  // Use QueryBuilder ou repository direto quando precisar navegar por elas.
  @OneToMany('RecipeComponentEntity', 'ingredient')
  recipeComponents: unknown[];

  @OneToMany('StockLevelEntity', 'ingredient')
  stockLevels: unknown[];
}
