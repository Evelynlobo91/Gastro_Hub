import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

/** Define ou atualiza o estoque mínimo de um insumo em uma marca. */
export class SetStockMinimumDto {
  @ApiProperty({ example: 'b2c3d4e5-...', description: 'UUID do ingrediente' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID da marca' })
  @IsUUID()
  brandId: string;

  @ApiProperty({ example: 500, description: 'Estoque mínimo (>= 0)' })
  @IsNumber()
  @Min(0)
  minimum: number;
}
