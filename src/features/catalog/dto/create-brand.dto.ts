import { IsString, IsNotEmpty, IsOptional, MinLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'Burger King', description: 'Nome da marca' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  /**
   * Slug único derivado do nome (ex: "burger-king").
   * Se não informado, é gerado automaticamente a partir do name.
   */
  @ApiPropertyOptional({ example: 'burger-king', description: 'Slug único da marca' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional({ description: 'Descrição da marca' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL do logotipo da marca' })
  @IsString()
  @IsOptional()
  @IsUrl()
  logo_url?: string;
}

export class UpdateBrandDto {
  @ApiPropertyOptional({ example: 'Burger King', description: 'Nome da marca' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'burger-king', description: 'Slug único da marca' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional({ description: 'Descrição da marca' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL do logotipo da marca' })
  @IsString()
  @IsOptional()
  @IsUrl()
  logo_url?: string;
}
