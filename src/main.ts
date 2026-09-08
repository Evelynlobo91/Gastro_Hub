import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const appCfg = config.getOrThrow<AppConfig>('app');

  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  // Roteamento inicial do Gateway (issue #9): tudo sob /api/<versão>.
  const globalPrefix = `${appCfg.apiPrefix}/${appCfg.apiVersion}`;
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  if (appCfg.env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gastro_Hub API')
      .setDescription('Praça multimarca — API do monólito modular (Fase 0/1)')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document);
  }

  await app.listen(appCfg.port);
  Logger.log(`Gastro_Hub em http://localhost:${appCfg.port}/${globalPrefix}`, 'Bootstrap');
}

void bootstrap();
