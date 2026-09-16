import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DeliveryStatus } from '../entities/delivery.entity';

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus, description: 'Novo status da entrega/retirada' })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional({ description: 'UUID do entregador responsável' })
  @IsUUID()
  @IsOptional()
  courier_id?: string;

  @ApiPropertyOptional({ description: 'Nome do entregador' })
  @IsString()
  @IsOptional()
  courier_name?: string;

  @ApiPropertyOptional({ description: 'Telefone do entregador' })
  @IsString()
  @IsOptional()
  courier_phone?: string;
}
