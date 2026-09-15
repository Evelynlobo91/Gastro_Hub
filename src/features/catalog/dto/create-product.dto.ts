import { IsString, IsNotEmpty, IsOptional, MinLength, IsPositive, Min, IsUrl, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Big Mac', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do produto' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'BK-001', description: 'SKU único do produto' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 1990, description: 'Preço em centavos (ex: 1990 = R$ 19,90)' })
  @IsPositive()
  @Min(0)
  price_cents: number;

  @ApiProperty({ example: 50, description: 'Quantidade em estoque' })
  @IsPositive()
  @Min(0)
  stock_quantity: number;

  @ApiPropertyOptional({ description: 'URL da imagem do produto' })
  @IsString()
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Atributos variáveis (JSONB)' })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'UUID da marca' })
  @IsUUID()
  @IsOptional()
  brand_id?: string;

  @ApiPropertyOptional({ description: 'UUID da categoria' })
  @IsUUID()
  @IsOptional()
  category_id?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Big Mac' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsPositive()
  @Min(0)
  @IsOptional()
  price_cents?: number;

  @ApiPropertyOptional()
  @IsPositive()
  @Min(0)
  @IsOptional()
  stock_quantity?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsUrl()
  image_url?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  specifications?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brand_id?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  category_id?: string;
}
