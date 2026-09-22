import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BrandEntity } from '../../brands/brand.entity';
import { CategoryEntity } from './category.entity';

/**
 * Produto do catálogo da praça multimarca (issue #12).
 * Preço em centavos para evitar aritmética de ponto flutuante.
 */
@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  sku?: string;

  /** Preço em centavos (ex: 1990 = R$ 19,90). */
  @Column({ type: 'integer', nullable: false, name: 'price_cents' })
  priceCents: number;

  @Column({ type: 'integer', default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  imageUrl?: string;

  /** Atributos variáveis por marca (tamanho, ingredientes, etc.). */
  @Column({ type: 'jsonb', nullable: true })
  specifications?: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true, name: 'brand_id' })
  brandId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId?: string;

  @ManyToOne(() => BrandEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandEntity;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
