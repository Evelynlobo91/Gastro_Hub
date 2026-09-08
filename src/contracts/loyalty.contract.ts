import { Money, UUID } from './common.contract';

/**
 * Contrato do módulo de Fidelidade (issues #18/#22 — Fases 2 e 3).
 * Acúmulo de pontos e resgate em qualquer marca da plataforma.
 */
export const LOYALTY_SERVICE = Symbol('LOYALTY_SERVICE');

export interface LoyaltyBalance {
  customerId: UUID;
  points: number;
  updatedAt: Date;
}

export type LoyaltyEntryType = 'earn' | 'redeem' | 'expire' | 'adjust';

export interface LoyaltyEntry {
  id: UUID;
  customerId: UUID;
  type: LoyaltyEntryType;
  points: number;
  orderId: UUID | null;
  brandId: UUID | null;
  createdAt: Date;
}

export interface ILoyaltyService {
  getBalance(customerId: UUID): Promise<LoyaltyBalance>;
  accrueFromOrder(customerId: UUID, orderId: UUID, orderTotal: Money): Promise<LoyaltyEntry>;
  redeem(customerId: UUID, points: number, brandId: UUID): Promise<LoyaltyEntry>;
}
