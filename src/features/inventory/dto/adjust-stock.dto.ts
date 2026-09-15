import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { StockMovementType } from '../../../contracts';

/** Movimentação manual de estoque (compra, ajuste, desperdício). */
export class AdjustStockDto {
  @ApiProperty({ example: 'b2c3d4e5-...', description: 'UUID do ingrediente' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID da marca' })
  @IsUUID()
  brandId: string;

  @ApiProperty({
    example: 'purchase',
    enum: ['purchase', 'adjustment', 'waste'],
    description: 'Tipo de movimentação manual',
  })
  @IsIn(['purchase', 'adjustment', 'waste'])
  type: Extract<StockMovementType, 'purchase' | 'adjustment' | 'waste'>;

  /**
   * Quantidade a movimentar (sempre positiva aqui).
   * O service aplica o sinal correto conforme o type.
   */
  @ApiProperty({ example: 1000, description: 'Quantidade absoluta da movimentação' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'UUID do pedido relacionado (opcional)' })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
