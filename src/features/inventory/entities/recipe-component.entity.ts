import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { IngredientEntity } from './ingredient.entity';

/**
 * Componente da ficha técnica de um produto (issue #15 — Fase 2).
 *
 * PK composta (product_id, ingredient_id) — cada insumo aparece uma vez por produto.
 * CHECK (quantity > 0) — regra de negócio garantida no banco.
 * quantity é o volume consumido por UNIDADE do produto na unidade base do ingrediente.
 */
@Check('"quantity" > 0')
@Entity('recipe_components')
export class RecipeComponentEntity {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId: string;

  @PrimaryColumn({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  /** Quantidade consumida por unidade do produto (na unidade base do insumo). */
  @Column({ type: 'numeric', precision: 10, scale: 4 })
  quantity: number;

  /** Unidade usada nesta ficha (pode diferir da base_unit para exibição). */
  @Column({ type: 'text' })
  unit: string;
}
