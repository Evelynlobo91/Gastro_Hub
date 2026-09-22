import { IsString, IsNotEmpty, IsOptional, MinLength, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lanches', description: 'Nome da categoria' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'lanches', description: 'Slug único da categoria' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  slug: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL do ícone da categoria' })
  @IsString()
  @IsOptional()
  @IsUrl()
  icon_url?: string;

  @ApiPropertyOptional({ description: 'UUID da categoria pai (subcategorias)' })
  @IsUUID()
  @IsOptional()
  parent_category_id?: string;

  @ApiPropertyOptional({ description: 'UUID da marca à qual a categoria pertence' })
  @IsUUID()
  @IsOptional()
  brand_id?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Lanches', description: 'Nome da categoria' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'lanches', description: 'Slug único da categoria' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL do ícone da categoria' })
  @IsString()
  @IsOptional()
  @IsUrl()
  icon_url?: string;

  @ApiPropertyOptional({ description: 'UUID da categoria pai' })
  @IsUUID()
  @IsOptional()
  parent_category_id?: string;

  @ApiPropertyOptional({ description: 'UUID da marca' })
  @IsUUID()
  @IsOptional()
  brand_id?: string;
}
