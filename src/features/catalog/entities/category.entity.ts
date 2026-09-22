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
import { BrandEntity } from '../../brands/brand.entity';

/**
 * Categoria de produtos da praça multimarca (issue #12).
 * Suporta hierarquia (parent_category_id) e vínculo opcional com marca.
 */
@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'icon_url' })
  iconUrl?: string;

  /** UUID da categoria pai — hierarquia de categorias. */
  @Column({ type: 'uuid', nullable: true, name: 'parent_category_id' })
  parentCategoryId?: string;

  /** UUID da marca à qual a categoria pertence. */
  @Column({ type: 'uuid', nullable: true, name: 'brand_id' })
  brandId?: string;

  @ManyToOne(() => BrandEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
