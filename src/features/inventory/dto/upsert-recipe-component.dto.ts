import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';

/** Adiciona ou atualiza um componente (insumo) na ficha técnica de um produto. */
export class UpsertRecipeComponentDto {
  @ApiProperty({ example: 'c3d4e5f6-...', description: 'UUID do ingrediente' })
  @IsUUID()
  ingredientId: string;

  /** Quantidade consumida por unidade do produto (> 0). */
  @ApiProperty({ example: 150, description: 'Quantidade na unidade base do insumo (> 0)' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 'g', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  unit: string;
}
