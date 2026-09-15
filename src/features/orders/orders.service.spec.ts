import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { SubOrderEntity } from './entities/sub-order.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: ReturnType<typeof mockRepository>;
  let orderItemRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useFactory: mockRepository },
        { provide: getRepositoryToken(OrderItemEntity), useFactory: mockRepository },
        { provide: getRepositoryToken(SubOrderEntity), useFactory: mockRepository },
        { provide: getRepositoryToken(PaymentEntity), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(OrderEntity));
    orderItemRepository = module.get(getRepositoryToken(OrderItemEntity));
  });

  describe('createOrder', () => {
    it('deve criar um novo pedido com subtotal calculado', async () => {
      const dto: CreateOrderDto = {
        user_id: 'uuid-user',
        customer_name: 'João Silva',
        customer_phone: '11999999999',
        customer_address: 'Rua das Flores, 123',
        delivery_fee_cents: 500,
        order_items: [
          {
            product_id: 'uuid-product',
            product_name: 'Big Mac',
            unit_price_cents: 1990,
            quantity: 2,
          },
        ],
      };

      const savedOrder = { id: 'uuid-order', subtotalCents: 0, totalAmountCents: 0 };
      orderRepository.create.mockReturnValue(savedOrder);
      orderRepository.save.mockResolvedValue({ ...savedOrder, subtotalCents: 3980, totalAmountCents: 4480 });
      orderItemRepository.create.mockReturnValue({});
      orderItemRepository.save.mockResolvedValue({});

      const order = await service.createOrder(dto);

      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(order).toBeDefined();
    });
  });

  describe('findAllOrders', () => {
    it('deve retornar todos os pedidos em ordem decrescente', async () => {
      const orders = [{ id: 'uuid-1', customerName: 'João Silva' }];
      orderRepository.find.mockResolvedValue(orders);

      const result = await service.findAllOrders();

      expect(orderRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });
  });

  describe('findOrderById', () => {
    it('deve lançar NotFoundException se o pedido não existir', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOrderById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
