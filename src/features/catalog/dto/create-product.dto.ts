import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID da marca' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: 'b2c3d4e5-...', description: 'UUID da categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'X-Burguer Artesanal', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Pão brioche, blend 180g, cheddar...', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  /**
   * Preço em **centavos** (ex.: R$ 29,90 → 2990).
   * CHECK (price_cents >= 0) aplicado no banco.
   */
  @ApiProperty({ example: 2990, description: 'Preço em centavos (BRL)' })
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  /** Atributos variáveis por marca (JSONB). Ex.: { "vegano": true, "picante": false } */
  @ApiPropertyOptional({ example: { vegano: false }, default: {} })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
