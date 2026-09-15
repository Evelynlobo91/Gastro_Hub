import {
  IsUUID,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsPositive,
  Min,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';

export enum PaymentMethodDto {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  ONLINE_TRANSFER = 'ONLINE_TRANSFER',
}

export class CreateOrderItemDto {
  @ApiProperty({ description: 'UUID do produto' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Nome do produto (snapshot)' })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({ example: 1990, description: 'Preço unitário em centavos (snapshot)' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  unit_price_cents: number;

  @ApiProperty({ example: 2, description: 'Quantidade' })
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Instruções especiais' })
  @IsString()
  @IsOptional()
  special_instructions?: string;

  @ApiPropertyOptional({ description: 'Customizações (ex: sem cebola)' })
  @IsOptional()
  customizations?: Record<string, unknown>;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'UUID do usuário' })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  customer_name: string;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do cliente' })
  @IsString()
  @IsNotEmpty()
  customer_phone: string;

  @ApiProperty({ example: 'Av. Principal, 1234', description: 'Endereço de entrega' })
  @IsString()
  @IsNotEmpty()
  customer_address: string;

  @ApiPropertyOptional({ description: 'Instruções de entrega' })
  @IsString()
  @IsOptional()
  delivery_instructions?: string;

  @ApiProperty({ example: 500, description: 'Taxa de entrega em centavos' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  delivery_fee_cents: number;

  @ApiPropertyOptional({ enum: PaymentMethodDto, description: 'Método de pagamento' })
  @IsString()
  @IsIn(Object.values(PaymentMethodDto))
  @IsOptional()
  payment_method?: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'Observações gerais' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID do restaurante/filial' })
  @IsUUID()
  @IsOptional()
  restaurant_branch_id?: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Itens do pedido' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  order_items: CreateOrderItemDto[];
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(2)
  customer_name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customer_address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  delivery_instructions?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsString()
  @IsIn(Object.values(OrderStatus))
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentMethodDto })
  @IsString()
  @IsOptional()
  @IsIn(Object.values(PaymentMethodDto))
  payment_method?: PaymentMethodDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Min(0)
  delivery_fee_cents?: number;
}
