import { Money, PaginatedResult, PaginationQuery, UUID } from './common.contract';

/**
 * Contrato do módulo de Catálogo & Marcas (issues #12/#13 — Fase 2).
 * Declarado agora na Fase 0 para que Orders e Inventory programem contra a interface.
 */
export const CATALOG_SERVICE = Symbol('CATALOG_SERVICE');

export interface BrandSummary {
  id: UUID;
  name: string;
  slug: string;
  active: boolean;
}

export interface ProductSummary {
  id: UUID;
  brandId: UUID;
  categoryId: UUID;
  name: string;
  description: string | null;
  price: Money;
  available: boolean;
  /** Atributos variáveis por marca — mapeado para coluna JSONB. */
  attributes: Record<string, unknown>;
}

export interface ICatalogService {
  listBrands(): Promise<BrandSummary[]>;
  getMenu(brandId: UUID, query?: PaginationQuery): Promise<PaginatedResult<ProductSummary>>;
  getProduct(productId: UUID): Promise<ProductSummary | null>;
}
