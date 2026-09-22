import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsUUID, Min } from 'class-validator';

/**
 * Cria uma solicitação de transferência de insumo entre marcas.
 * Regra: transfer_price_cents > unit_cost_cents — validada no service e no banco.
 */
export class CreateBrandTransferDto {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID da marca origem (quem envia)' })
  @IsUUID()
  fromBrandId: string;

  @ApiProperty({ example: 'b2c3d4e5-...', description: 'UUID da marca destino (quem recebe)' })
  @IsUUID()
  toBrandId: string;

  @ApiProperty({ example: 'c3d4e5f6-...', description: 'UUID do ingrediente transferido' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 500, description: 'Quantidade na unidade base do insumo (> 0)' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ example: 200, description: 'Custo de aquisição unitário em centavos' })
  @IsInt()
  @Min(0)
  unitCostCents: number;

  @ApiProperty({
    example: 250,
    description: 'Preço de transferência em centavos — deve ser maior que unitCostCents',
  })
  @IsInt()
  @Min(1)
  transferPriceCents: number;
}
