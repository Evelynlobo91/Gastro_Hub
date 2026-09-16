import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { FulfillmentType } from './entities/delivery.entity';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Public()
  @Post('zones')
  @ApiOperation({ summary: 'Cadastrar nova região/zona de entrega do restaurante' })
  @ApiResponse({ status: 201, description: 'Região cadastrada com sucesso' })
  async createZone(@Body() dto: CreateDeliveryZoneDto) {
    return this.deliveryService.createZone(dto);
  }

  @Public()
  @Get('zones/:restaurantId')
  @ApiOperation({ summary: 'Listar regiões de entrega cadastradas de um restaurante' })
  async getZonesByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.deliveryService.getZonesByRestaurant(restaurantId);
  }

  @Public()
  @Put('zones/:id')
  @ApiOperation({ summary: 'Atualizar região de entrega' })
  async updateZone(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryZoneDto,
  ) {
    return this.deliveryService.updateZone(id, dto);
  }

  @Public()
  @Delete('zones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover região de entrega' })
  async deleteZone(@Param('id') id: string) {
    return this.deliveryService.deleteZone(id);
  }

  @Public()
  @Post('calculate-fee')
  @ApiOperation({ summary: 'Calcular taxa de frete e estimativa de tempo baseada no critério' })
  async calculateFee(
    @Body() body: {
      fulfillment_type: FulfillmentType;
      restaurant_id?: string;
      delivery_region_id?: string;
      distance_km?: number;
    },
  ) {
    return this.deliveryService.calculateDeliveryFee(
      body.fulfillment_type,
      body.restaurant_id,
      body.delivery_region_id,
      body.distance_km,
    );
  }

  @Public()
  @Get('tracking/:orderId')
  @ApiOperation({ summary: 'Rastrear status de entrega/retirada pelo ID do pedido' })
  async getTracking(@Param('orderId') orderId: string) {
    return this.deliveryService.getDeliveryByOrderId(orderId);
  }

  @Public()
  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status de entrega (ASSIGNED, PICKED_UP, ON_THE_WAY, DELIVERED, READY_FOR_PICKUP)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(id, dto);
  }
}
