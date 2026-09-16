import { Money, UUID } from './common.contract';

/**
 * Contrato do módulo de Pedidos (issues #14/#16 — Fase 2).
 * Modela o carrinho unificado e a divisão em subcomandas por cozinha.
 */
export const ORDERS_SERVICE = Symbol('ORDERS_SERVICE');

export type OrderStatus =
  'cart' | 'awaiting_payment' | 'paid' | 'in_preparation' | 'ready' | 'completed' | 'cancelled';

export type SubOrderStatus = 'queued' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';

export interface CartItemInput {
  productId: UUID;
  quantity: number;
  notes?: string;
}

export interface OrderItem extends CartItemInput {
  id: UUID;
  brandId: UUID;
  unitPrice: Money;
  lineTotal: Money;
}

/** Subcomanda: fatia do pedido pertencente a uma única marca/cozinha. */
export interface SubOrder {
  id: UUID;
  orderId: UUID;
  brandId: UUID;
  status: SubOrderStatus;
  items: OrderItem[];
  subtotal: Money;
}

export interface Order {
  id: UUID;
  customerId: UUID;
  status: OrderStatus;
  items: OrderItem[];
  subOrders: SubOrder[];
  total: Money;
  createdAt: Date;
}

export interface IOrdersService {
  getOrCreateCart(customerId: UUID): Promise<Order>;
  addItem(customerId: UUID, item: CartItemInput): Promise<Order>;
  removeItem(customerId: UUID, itemId: UUID): Promise<Order>;
  checkout(customerId: UUID): Promise<Order>;
}
