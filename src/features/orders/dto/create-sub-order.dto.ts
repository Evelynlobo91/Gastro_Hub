import {
  IsUUID,
  IsPositive,
  Min,
  IsOptional,
  IsIn,
  IsString,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubOrderStatus } from '../entities/sub-order.entity';

export class CreateSubOrderDto {
  @ApiProperty({ description: 'UUID do pedido pai' })
  @IsUUID()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty({ description: 'UUID do restaurante' })
  @IsUUID()
  @IsNotEmpty()
  restaurant_id: string;

  @ApiProperty({ example: 'Burger King Central', description: 'Nome do restaurante' })
  @IsString()
  @IsNotEmpty()
  restaurant_name: string;

  @ApiProperty({ example: 'Unidade Paulista', description: 'Nome da filial' })
  @IsString()
  @IsNotEmpty()
  restaurant_branch_name: string;

  @ApiPropertyOptional({ enum: SubOrderStatus, description: 'Status inicial da subcomanda' })
  @IsString()
  @IsIn(Object.values(SubOrderStatus))
  @IsOptional()
  status?: SubOrderStatus;

  @ApiProperty({ example: 3980, description: 'Total da subcomanda em centavos' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  total_amount_cents: number;

  @ApiProperty({ example: 3480, description: 'Subtotal (sem entrega) em centavos' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  subtotal_cents: number;

  @ApiProperty({ example: 500, description: 'Taxa de entrega em centavos' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  delivery_fee_cents: number;
}

export class UpdateSubOrderDto {
  @ApiPropertyOptional({ enum: SubOrderStatus })
  @IsString()
  @IsIn(Object.values(SubOrderStatus))
  @IsOptional()
  status?: SubOrderStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Min(0)
  total_amount_cents?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Min(0)
  subtotal_cents?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Min(0)
  delivery_fee_cents?: number;
}
