import { UUID } from './common.contract';

/**
 * Contrato do módulo de Estoque (issues #15/#17 — Fase 2).
 * Ficha técnica (receita) por produto e baixa automática ao confirmar o pedido.
 */
export const INVENTORY_SERVICE = Symbol('INVENTORY_SERVICE');

export type StockMovementType =
  'purchase' | 'consumption' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'waste';

export interface RecipeComponent {
  ingredientId: UUID;
  /** Quantidade do insumo consumida por unidade do produto, na unidade base. */
  quantity: number;
  unit: string;
}

export interface StockLevel {
  ingredientId: UUID;
  brandId: UUID;
  onHand: number;
  minimum: number;
  belowMinimum: boolean;
}

export interface ConsumeStockCommand {
  brandId: UUID;
  productId: UUID;
  quantity: number;
  orderId: UUID;
}

export interface IInventoryService {
  getRecipe(productId: UUID): Promise<RecipeComponent[]>;
  consumeForOrder(commands: ConsumeStockCommand[]): Promise<void>;
  getLowStock(brandId: UUID): Promise<StockLevel[]>;
}
