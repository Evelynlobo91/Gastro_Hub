/**
 * Tipo de atendimento do pedido.
 * Extraído para arquivo separado para evitar circular import entre
 * OrderEntity e DeliveryEntity.
 */
export enum FulfillmentType {
  DINE_IN = 'DINE_IN',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}
