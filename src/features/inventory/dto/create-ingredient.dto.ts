import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  /** Nulo = insumo compartilhado por todas as marcas. */
  @ApiPropertyOptional({ example: 'a1b2c3d4-...', description: 'UUID da marca (nulo = compartilhado)' })
  @IsOptional()
  @IsUUID()
  brandId?: string | null;

  @ApiProperty({ example: 'Farinha de trigo', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'g', enum: ['g', 'ml', 'un'], description: 'Unidade base: g | ml | un' })
  @IsIn(['g', 'ml', 'un'])
  baseUnit: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
