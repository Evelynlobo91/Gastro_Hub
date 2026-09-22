import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { CreateSubOrderDto, UpdateSubOrderDto } from './dto/create-sub-order.dto';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { OrderEntity, OrderStatus } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { SubOrderEntity } from './entities/sub-order.entity';
import { PaymentEntity } from './entities/payment.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Orders ─────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiCreatedResponse({ type: OrderEntity })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos' })
  @ApiOkResponse({ type: [OrderEntity] })
  async findAllOrders(): Promise<OrderEntity[]> {
    return this.ordersService.findAllOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrderEntity })
  @ApiNotFoundResponse({ description: 'Pedido não encontrado' })
  async findOrder(@Param('id', ParseUUIDPipe) id: string): Promise<OrderEntity> {
    return this.ordersService.findOrderById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    return this.ordersService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar/remover pedido' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async deleteOrder(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.deleteOrder(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
  ): Promise<OrderEntity> {
    return this.ordersService.updateOrderStatus(id, status);
  }

  // ─── OrderItems ──────────────────────────────────────────────────────────────

  @Post(':orderId/items')
  @ApiOperation({ summary: 'Adicionar item ao pedido' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiCreatedResponse({ type: OrderItemEntity })
  async createOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() createOrderItemDto: CreateOrderItemDto,
  ): Promise<OrderItemEntity> {
    return this.ordersService.createOrderItem(orderId, createOrderItemDto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover item do pedido' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  async deleteOrderItem(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.deleteOrderItem(id);
  }

  // ─── SubOrders ───────────────────────────────────────────────────────────────

  @Post('sub-orders')
  @ApiOperation({ summary: 'Criar subcomanda' })
  @ApiCreatedResponse({ type: SubOrderEntity })
  async createSubOrder(@Body() createSubOrderDto: CreateSubOrderDto): Promise<SubOrderEntity> {
    return this.ordersService.createSubOrder(createSubOrderDto);
  }

  @Get('sub-orders')
  @ApiOperation({ summary: 'Listar subcomandas' })
  @ApiOkResponse({ type: [SubOrderEntity] })
  async findAllSubOrders(): Promise<SubOrderEntity[]> {
    return this.ordersService.findAllSubOrders();
  }

  @Get('sub-orders/:id')
  @ApiOperation({ summary: 'Buscar subcomanda por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SubOrderEntity })
  async findSubOrder(@Param('id', ParseUUIDPipe) id: string): Promise<SubOrderEntity> {
    return this.ordersService.findSubOrderById(id);
  }

  @Put('sub-orders/:id')
  @ApiOperation({ summary: 'Atualizar subcomanda' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updateSubOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubOrderDto: UpdateSubOrderDto,
  ): Promise<SubOrderEntity> {
    return this.ordersService.updateSubOrder(id, updateSubOrderDto);
  }

  // ─── Payments ────────────────────────────────────────────────────────────────

  @Post('payments')
  @ApiOperation({ summary: 'Registrar pagamento' })
  @ApiCreatedResponse({ type: PaymentEntity })
  @ApiBadRequestResponse({ description: 'Valor do pagamento não corresponde ao total do pedido' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentEntity> {
    return this.ordersService.createPayment(createPaymentDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos' })
  @ApiOkResponse({ type: [PaymentEntity] })
  async findAllPayments(): Promise<PaymentEntity[]> {
    return this.ordersService.findAllPayments();
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaymentEntity })
  async findPayment(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentEntity> {
    return this.ordersService.findPaymentById(id);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Atualizar dados do pagamento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentEntity> {
    return this.ordersService.updatePayment(id, updatePaymentDto);
  }

  @Put('payments/:id/complete')
  @ApiOperation({ summary: 'Confirmar pagamento como concluído' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async completePayment(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentEntity> {
    return this.ordersService.completePayment(id);
  }

  @Put('payments/:id/refund')
  @ApiOperation({ summary: 'Estornar pagamento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBadRequestResponse({ description: 'Pagamento não está com status COMPLETED' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount?: number,
  ): Promise<PaymentEntity> {
    return this.ordersService.refundPayment(id, amount);
  }
}
