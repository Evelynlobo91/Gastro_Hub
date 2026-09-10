import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token emitido no login' })
  @IsJWT()
  refreshToken: string;
}
