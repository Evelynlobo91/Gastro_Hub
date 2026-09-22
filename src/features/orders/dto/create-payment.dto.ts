import {
  IsUUID,
  IsIn,
  IsString,
  IsEnum,
  IsPositive,
  Min,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID do pedido' })
  @IsUUID()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Status inicial' })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ example: 3980, description: 'Valor em centavos' })
  @IsPositive()
  @Min(0)
  @IsNotEmpty()
  amount_cents: number;

  @ApiPropertyOptional({ description: 'ID da transação no gateway' })
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @ApiPropertyOptional({ description: 'Nome do gateway de pagamento' })
  @IsString()
  @IsOptional()
  payment_gateway?: string;

  @ApiPropertyOptional({ description: 'Dados adicionais do gateway (JSON)' })
  @IsString()
  @IsOptional()
  payment_data?: string;

  @ApiPropertyOptional({ example: '4242', description: 'Últimos 4 dígitos do cartão' })
  @IsString()
  @IsOptional()
  card_last_four?: string;

  @ApiPropertyOptional()
  @IsPositive()
  @Min(0)
  @IsOptional()
  refund_amount_cents?: number;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  payment_gateway?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  payment_data?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  card_last_four?: string;

  @ApiPropertyOptional()
  @IsPositive()
  @Min(0)
  @IsOptional()
  refund_amount_cents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  paid_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  refunded_at?: Date;
}
