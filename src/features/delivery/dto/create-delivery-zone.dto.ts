import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateDeliveryZoneDto {
  @ApiProperty({ description: 'UUID do restaurante' })
  @IsUUID()
  @IsNotEmpty()
  restaurant_id: string;

  @ApiProperty({ example: 'Centro / Zona Sul', description: 'Nome da região de entrega' })
  @IsString()
  @IsNotEmpty()
  zone_name: string;

  @ApiProperty({ example: 0, description: 'Distância mínima em km' })
  @IsNumber()
  @Min(0)
  min_distance_km: number;

  @ApiProperty({ example: 5.5, description: 'Distância máxima em km' })
  @IsNumber()
  @IsPositive()
  max_distance_km: number;

  @ApiProperty({ example: 890, description: 'Taxa de entrega em centavos (R$ 8,90)' })
  @IsNumber()
  @Min(0)
  delivery_fee_cents: number;

  @ApiPropertyOptional({ example: 35, description: 'Tempo estimado de entrega em minutos' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  estimated_time_minutes?: number;
}

export class UpdateDeliveryZoneDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zone_name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  min_distance_km?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  max_distance_km?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  delivery_fee_cents?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  estimated_time_minutes?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
