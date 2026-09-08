/**
 * Contratos compartilhados entre módulos (issue #5).
 * Tipos primitivos de domínio reutilizados por todos os módulos do monólito.
 */

/** Valor monetário sempre em centavos + moeda ISO-4217, para evitar float. */
export interface Money {
  amountCents: number;
  currency: 'BRL';
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export type UUID = string;
