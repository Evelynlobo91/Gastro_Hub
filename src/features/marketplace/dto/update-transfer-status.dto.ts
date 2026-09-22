import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Atualiza o status de uma transferência entre marcas. */
export class UpdateTransferStatusDto {
  @ApiProperty({
    example: 'approved',
    enum: ['approved', 'shipped', 'received', 'rejected'],
    description: 'Novo status da transferência',
  })
  @IsIn(['approved', 'shipped', 'received', 'rejected'])
  status: 'approved' | 'shipped' | 'received' | 'rejected';
}
