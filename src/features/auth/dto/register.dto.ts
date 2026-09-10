import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@exemplo.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Senha#Forte123', minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'A senha deve ter ao menos 10 caracteres' })
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'A senha deve conter maiúscula, minúscula e número',
  })
  password: string;

  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName: string;

  @ApiProperty({
    required: false,
    example: '12345678901',
    description: 'Cifrado em repouso (LGPD)',
  })
  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos' })
  cpf?: string;

  @ApiProperty({ required: false, example: '11987654321' })
  @IsOptional()
  @Matches(/^\d{10,13}$/, { message: 'Telefone inválido' })
  phone?: string;
}
