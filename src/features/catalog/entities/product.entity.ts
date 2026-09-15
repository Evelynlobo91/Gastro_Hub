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
import { CategoryEntity } from './category.entity';

/**
 * Produto do cardápio de uma marca (issue #13 — Fase 2).
 *
 * Regras de negócio em CHECK no banco (conforme convenção do projeto):
 *   - price_cents >= 0
 *
 * Índices mantidos na migration:
 *   - Composto (brand_id, available) para filtro de cardápio
 *   - GIN em attributes para busca por atributos JSONB
 */
@Check('"price_cents" >= 0')
@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'brand_id' })
  brandId: string;

  @ManyToOne(() => BrandEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => CategoryEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Preço em centavos — nunca float (convenção do projeto). */
  @Column({ type: 'int', name: 'price_cents' })
  priceCents: number;

  /** Moeda ISO-4217, padrão BRL. */
  @Column({ type: 'char', length: 3, default: 'BRL' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  /** Atributos variáveis por marca — mapeado para coluna JSONB com índice GIN. */
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
