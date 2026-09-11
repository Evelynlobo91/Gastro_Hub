import { plainToInstance, Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Variáveis de ambiente vêm sempre como string (do shell / do CI), então a
 * coerção para número/boolean é explícita — `enableImplicitConversion` do
 * class-transformer é frágil e não dispara de forma confiável aqui.
 */
const toNumber = ({ value }: TransformFnParams): unknown =>
  value === undefined || value === null || value === '' ? undefined : Number(value);

const toBoolean = ({ value }: TransformFnParams): unknown =>
  typeof value === 'boolean' ? value : value === 'true' || value === '1';

/**
 * Valida as variáveis de ambiente no boot (issue #4). Falha rápido se algo
 * essencial estiver ausente ou malformado.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  DB_HOST: string;

  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  DB_PORT = 5432;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  DB_SSL = false;

  @IsString()
  @MinLength(16, { message: 'DB_ENCRYPTION_KEY deve ter ao menos 16 caracteres (LGPD).' })
  DB_ENCRYPTION_KEY: string;

  @IsString()
  REDIS_HOST: string;

  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  @MinLength(8)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(8)
  JWT_REFRESH_SECRET: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Configuração de ambiente inválida:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    );
  }
  return validatedConfig;
}
