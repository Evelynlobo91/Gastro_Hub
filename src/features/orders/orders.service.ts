import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { CreateSubOrderDto, UpdateSubOrderDto } from './dto/create-sub-order.dto';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { OrderEntity, OrderStatus } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { SubOrderEntity, SubOrderStatus } from './entities/sub-order.entity';
import { PaymentEntity, PaymentStatus } from './entities/payment.entity';

/**
 * OrdersService — CRUD de pedidos, subcomandas e pagamentos (issue #14).
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(SubOrderEntity)
    private readonly subOrderRepository: Repository<SubOrderEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  // ─── Order ──────────────────────────────────────────────────────────────────

  async createOrder(dto: CreateOrderDto): Promise<OrderEntity> {
    const order = this.orderRepository.create({
      userId: dto.user_id,
      customerName: dto.customer_name,
      customerPhone: dto.customer_phone,
      customerAddress: dto.customer_address,
      deliveryInstructions: dto.delivery_instructions,
      deliveryFeeCents: dto.delivery_fee_cents,
      paymentMethod: dto.payment_method,
      notes: dto.notes,
      restaurantBranchId: dto.restaurant_branch_id,
    });

    const savedOrder = await this.orderRepository.save(order);

    let subtotal = 0;
    for (const itemDto of dto.order_items) {
      const itemSubtotal = itemDto.quantity * itemDto.unit_price_cents;
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: itemDto.product_id,
        productName: itemDto.product_name,
        unitPriceCents: itemDto.unit_price_cents,
        quantity: itemDto.quantity,
        subtotalCents: itemSubtotal,
        specialInstructions: itemDto.special_instructions,
        customizations: itemDto.customizations,
      });
      await this.orderItemRepository.save(orderItem);
      subtotal += itemSubtotal;
    }

    savedOrder.subtotalCents = subtotal;
    savedOrder.totalAmountCents = subtotal + dto.delivery_fee_cents;
    return this.orderRepository.save(savedOrder);
  }

  async findAllOrders(): Promise<OrderEntity[]> {
    return this.orderRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrderById(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
    const order = await this.findOrderById(id);
    if (dto.customer_name) order.customerName = dto.customer_name;
    if (dto.customer_phone) order.customerPhone = dto.customer_phone;
    if (dto.customer_address) order.customerAddress = dto.customer_address;
    if (dto.delivery_instructions !== undefined) order.deliveryInstructions = dto.delivery_instructions;
    if (dto.status) order.status = dto.status;
    if (dto.payment_method) order.paymentMethod = dto.payment_method;
    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.delivery_fee_cents !== undefined) order.deliveryFeeCents = dto.delivery_fee_cents;
    return this.orderRepository.save(order);
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.findOrderById(id);
    await this.orderRepository.remove(order);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const order = await this.findOrderById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // ─── OrderItem ───────────────────────────────────────────────────────────────

  async createOrderItem(orderId: string, itemDto: CreateOrderItemDto): Promise<OrderItemEntity> {
    await this.findOrderById(orderId);
    const subtotalCents = itemDto.quantity * itemDto.unit_price_cents;
    const orderItem = this.orderItemRepository.create({
      orderId,
      productId: itemDto.product_id,
      productName: itemDto.product_name,
      unitPriceCents: itemDto.unit_price_cents,
      quantity: itemDto.quantity,
      subtotalCents,
      specialInstructions: itemDto.special_instructions,
      customizations: itemDto.customizations,
    });
    return this.orderItemRepository.save(orderItem);
  }

  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.orderItemRepository.findOne({ where: { id } });
    if (!orderItem) throw new NotFoundException(`Item de pedido com ID ${id} não encontrado`);
    await this.orderItemRepository.remove(orderItem);
  }

  // ─── SubOrder ────────────────────────────────────────────────────────────────

  async createSubOrder(dto: CreateSubOrderDto): Promise<SubOrderEntity> {
    const subOrder = this.subOrderRepository.create({
      orderId: dto.order_id,
      restaurantId: dto.restaurant_id,
      restaurantName: dto.restaurant_name,
      restaurantBranchName: dto.restaurant_branch_name,
      status: dto.status,
      totalAmountCents: dto.total_amount_cents,
      subtotalCents: dto.subtotal_cents,
      deliveryFeeCents: dto.delivery_fee_cents,
    });
    return this.subOrderRepository.save(subOrder);
  }

  async findAllSubOrders(): Promise<SubOrderEntity[]> {
    return this.subOrderRepository.find({ relations: ['order', 'restaurant'] });
  }

  async findSubOrderById(id: string): Promise<SubOrderEntity> {
    const subOrder = await this.subOrderRepository.findOne({
      where: { id },
      relations: ['order', 'restaurant'],
    });
    if (!subOrder) throw new NotFoundException(`SubOrder com ID ${id} não encontrada`);
    return subOrder;
  }

  async updateSubOrder(id: string, dto: UpdateSubOrderDto): Promise<SubOrderEntity> {
    const subOrder = await this.findSubOrderById(id);
    if (dto.status) subOrder.status = dto.status;
    if (dto.total_amount_cents !== undefined) subOrder.totalAmountCents = dto.total_amount_cents;
    if (dto.subtotal_cents !== undefined) subOrder.subtotalCents = dto.subtotal_cents;
    if (dto.delivery_fee_cents !== undefined) subOrder.deliveryFeeCents = dto.delivery_fee_cents;
    return this.subOrderRepository.save(subOrder);
  }

  // ─── Payment ─────────────────────────────────────────────────────────────────

  async createPayment(dto: CreatePaymentDto): Promise<PaymentEntity> {
    const order = await this.findOrderById(dto.order_id);
    if (order.totalAmountCents !== 0 && order.totalAmountCents !== dto.amount_cents) {
      throw new BadRequestException(
        `O valor do pagamento (${dto.amount_cents}) não corresponde ao total do pedido (${order.totalAmountCents})`,
      );
    }
    const payment = this.paymentRepository.create({
      orderId: dto.order_id,
      paymentMethod: dto.payment_method,
      status: dto.status,
      amountCents: dto.amount_cents,
      transactionId: dto.transaction_id,
      paymentGateway: dto.payment_gateway,
      paymentData: dto.payment_data,
      cardLastFour: dto.card_last_four,
    });
    return this.paymentRepository.save(payment);
  }

  async findAllPayments(): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({ relations: ['order'] });
  }

  async findPaymentById(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    return payment;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<PaymentEntity> {
    const payment = await this.findPaymentById(id);
    Object.assign(payment, {
      ...(dto.status && { status: dto.status }),
      ...(dto.transaction_id !== undefined && { transactionId: dto.transaction_id }),
      ...(dto.payment_gateway !== undefined && { paymentGateway: dto.payment_gateway }),
      ...(dto.payment_data !== undefined && { paymentData: dto.payment_data }),
      ...(dto.card_last_four !== undefined && { cardLastFour: dto.card_last_four }),
      ...(dto.refund_amount_cents !== undefined && { refundAmountCents: dto.refund_amount_cents }),
      ...(dto.paid_at !== undefined && { paidAt: dto.paid_at }),
      ...(dto.refunded_at !== undefined && { refundedAt: dto.refunded_at }),
    });
    return this.paymentRepository.save(payment);
  }

  async completePayment(id: string): Promise<PaymentEntity> {
    const payment = await this.findPaymentById(id);
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    return this.paymentRepository.save(payment);
  }

  async refundPayment(id: string, amount?: number): Promise<PaymentEntity> {
    const payment = await this.findPaymentById(id);
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Só é possível estornar pagamentos com status COMPLETED');
    }
    payment.status = PaymentStatus.REFUNDED;
    payment.refundAmountCents = amount ?? payment.amountCents;
    payment.refundedAt = new Date();
    return this.paymentRepository.save(payment);
  }
}
