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
 * Categoria de produtos de uma marca (issue #13 — Fase 2).
 * UNIQUE (brand_id, name) — cada marca tem seus próprios nomes de categoria.
 */
@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'brand_id' })
  brandId: string;

  @ManyToOne(() => BrandEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relação inversa (lazy — não carregada por padrão)
  @OneToMany('ProductEntity', 'category')
  products: import('./product.entity').ProductEntity[];
}
