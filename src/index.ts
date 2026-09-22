/**
 * Barrel dos contratos entre módulos (issue #5 — Fase 0).
 * Regra de arquitetura: um módulo importa OUTRO módulo apenas através destes
 * símbolos/interfaces, nunca dos seus services ou entities diretamente.
 */
export * from './common.contract';
export * from './auth.contract';
export * from './users.contract';
export * from './catalog.contract';
export * from './orders.contract';
export * from './inventory.contract';
export * from './loyalty.contract';
