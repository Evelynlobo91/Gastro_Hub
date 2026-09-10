import { plainToInstance } from 'class-transformer';
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
 * Valida as variáveis de ambiente no boot (issue #4).
 * Falha rápido caso algo essencial esteja ausente.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  @IsOptional()
  DB_PORT = 5432;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsBoolean()
  @IsOptional()
  DB_SSL = false;

  @IsString()
  @MinLength(16, { message: 'DB_ENCRYPTION_KEY deve ter ao menos 16 caracteres (LGPD).' })
  DB_ENCRYPTION_KEY: string;

  @IsString()
  REDIS_HOST: string;

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
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
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
