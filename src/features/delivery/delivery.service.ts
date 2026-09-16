import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZoneEntity } from './entities/delivery-zone.entity';
import { DeliveryEntity, DeliveryStatus, FulfillmentType } from './entities/delivery.entity';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { RabbitMQService } from '../../shared/messaging/rabbitmq.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryZoneEntity)
    private readonly zoneRepository: Repository<DeliveryZoneEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepository: Repository<DeliveryEntity>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // --- ZONAS DE ENTREGA (REGIÕES) ---

  async createZone(dto: CreateDeliveryZoneDto): Promise<DeliveryZoneEntity> {
    const zone = this.zoneRepository.create({
      restaurantId: dto.restaurant_id,
      zoneName: dto.zone_name,
      minDistanceKm: dto.min_distance_km,
      maxDistanceKm: dto.max_distance_km,
      deliveryFeeCents: dto.delivery_fee_cents,
      estimatedTimeMinutes: dto.estimated_time_minutes ?? 30,
    });
    return this.zoneRepository.save(zone);
  }

  async getZonesByRestaurant(restaurantId: string): Promise<DeliveryZoneEntity[]> {
    return this.zoneRepository.find({
      where: { restaurantId, isActive: true },
      order: { minDistanceKm: 'ASC' },
    });
  }

  async updateZone(id: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZoneEntity> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) throw new NotFoundException(`Região de entrega ${id} não encontrada`);

    if (dto.zone_name) zone.zoneName = dto.zone_name;
    if (dto.min_distance_km !== undefined) zone.minDistanceKm = dto.min_distance_km;
    if (dto.max_distance_km !== undefined) zone.maxDistanceKm = dto.max_distance_km;
    if (dto.delivery_fee_cents !== undefined) zone.deliveryFeeCents = dto.delivery_fee_cents;
    if (dto.estimated_time_minutes !== undefined) zone.estimatedTimeMinutes = dto.estimated_time_minutes;
    if (dto.is_active !== undefined) zone.isActive = dto.is_active;

    return this.zoneRepository.save(zone);
  }

  async deleteZone(id: string): Promise<void> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) throw new NotFoundException(`Região de entrega ${id} não encontrada`);
    await this.zoneRepository.remove(zone);
  }

  // --- CÁLCULO DE FRETE DINÂMICO ---

  async calculateDeliveryFee(
    fulfillmentType: FulfillmentType,
    restaurantId?: string,
    deliveryRegionId?: string,
    distanceKm?: number,
  ): Promise<{ feeCents: number; zoneName?: string; estimatedMinutes: number }> {
    // 1. Comer no local (DINE_IN) ou Retirada (PICKUP) -> Frete é R$ 0,00
    if (fulfillmentType === FulfillmentType.DINE_IN || fulfillmentType === FulfillmentType.PICKUP) {
      return {
        feeCents: 0,
        zoneName: fulfillmentType === FulfillmentType.DINE_IN ? 'Consumo no local' : 'Retirada no balcão',
        estimatedMinutes: 15,
      };
    }

    // 2. Entrega (DELIVERY) -> Requer região ou cálculo por distância do restaurante
    if (deliveryRegionId) {
      const zone = await this.zoneRepository.findOne({ where: { id: deliveryRegionId, isActive: true } });
      if (zone) {
        return {
          feeCents: zone.deliveryFeeCents,
          zoneName: zone.zoneName,
          estimatedMinutes: zone.estimatedTimeMinutes,
        };
      }
    }

    if (restaurantId && distanceKm !== undefined) {
      const zones = await this.getZonesByRestaurant(restaurantId);
      const matchedZone = zones.find(
        (z) => distanceKm >= z.minDistanceKm && distanceKm <= z.maxDistanceKm,
      );
      if (matchedZone) {
        return {
          feeCents: matchedZone.deliveryFeeCents,
          zoneName: matchedZone.zoneName,
          estimatedMinutes: matchedZone.estimatedTimeMinutes,
        };
      }
    }

    // Se nenhuma região for encontrada para entrega, retorna valor padrão configurado da região
    return {
      feeCents: 500, // R$ 5,00 padrão caso não tenha região cadastrada
      zoneName: 'Entrega Padrão',
      estimatedMinutes: 35,
    };
  }

  // --- GESTÃO DE ENTREGAS ---

  async createDeliveryForOrder(params: {
    orderId: string;
    restaurantId?: string;
    fulfillmentType: FulfillmentType;
    deliveryFeeCents: number;
    deliveryAddress?: string;
    deliveryRegionId?: string;
    tableNumber?: string;
  }): Promise<DeliveryEntity> {
    const delivery = this.deliveryRepository.create({
      orderId: params.orderId,
      restaurantId: params.restaurantId,
      fulfillmentType: params.fulfillmentType,
      status: params.fulfillmentType === FulfillmentType.DELIVERY ? DeliveryStatus.PENDING : DeliveryStatus.READY_FOR_PICKUP,
      deliveryFeeCents: params.deliveryFeeCents,
      deliveryAddress: params.deliveryAddress,
      deliveryRegionId: params.deliveryRegionId,
      tableNumber: params.tableNumber,
      pickupNoticeSent: params.fulfillmentType !== FulfillmentType.DELIVERY,
    });

    const savedDelivery = await this.deliveryRepository.save(delivery);

    // Publica evento no RabbitMQ
    await this.rabbitMQService.publish(
      RabbitMQService.EXCHANGE_DELIVERY,
      'delivery.created',
      {
        deliveryId: savedDelivery.id,
        orderId: savedDelivery.orderId,
        fulfillmentType: savedDelivery.fulfillmentType,
        status: savedDelivery.status,
        feeCents: savedDelivery.deliveryFeeCents,
      },
    );

    return savedDelivery;
  }

  async getDeliveryByOrderId(orderId: string): Promise<DeliveryEntity> {
    const delivery = await this.deliveryRepository.findOne({
      where: { orderId },
      relations: ['deliveryZone'],
    });
    if (!delivery) throw new NotFoundException(`Entrega para o pedido ${orderId} não encontrada`);
    return delivery;
  }

  async updateDeliveryStatus(
    deliveryId: string,
    dto: UpdateDeliveryStatusDto,
  ): Promise<DeliveryEntity> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException(`Entrega ${deliveryId} não encontrada`);

    delivery.status = dto.status;
    if (dto.courier_id) delivery.courierId = dto.courier_id;
    if (dto.courier_name) delivery.courierName = dto.courier_name;
    if (dto.courier_phone) delivery.courierPhone = dto.courier_phone;

    const now = new Date();
    if (dto.status === DeliveryStatus.ASSIGNED) delivery.assignedAt = now;
    if (dto.status === DeliveryStatus.PICKED_UP) delivery.pickedUpAt = now;
    if (dto.status === DeliveryStatus.DELIVERED) delivery.deliveredAt = now;

    // Se for consumo no local ou retirada e estiver pronto
    if (
      (delivery.fulfillmentType === FulfillmentType.DINE_IN || delivery.fulfillmentType === FulfillmentType.PICKUP) &&
      dto.status === DeliveryStatus.READY_FOR_PICKUP
    ) {
      delivery.pickupNoticeSent = true;
      this.logger.log(`Aviso emitido para o cliente ir buscar o pedido (Mesa: ${delivery.tableNumber || 'Balcão'})`);
    }

    const updated = await this.deliveryRepository.save(delivery);

    // Publica evento de atualização no RabbitMQ
    await this.rabbitMQService.publish(
      RabbitMQService.EXCHANGE_DELIVERY,
      `delivery.status.${dto.status.toLowerCase()}`,
      {
        deliveryId: updated.id,
        orderId: updated.orderId,
        fulfillmentType: updated.fulfillmentType,
        status: updated.status,
        courierName: updated.courierName,
        pickupNoticeSent: updated.pickupNoticeSent,
        tableNumber: updated.tableNumber,
        timestamp: now,
      },
    );

    return updated;
  }
}
