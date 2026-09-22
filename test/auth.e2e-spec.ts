import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMQService } from '../src/shared/messaging/rabbitmq.service';

/**
 * Smoke ponta-a-ponta da Fase 1: ambiente sobe + fluxo de login funcional
 * (marco de entrega do Épico #32). Requer PostgreSQL com migrations aplicadas.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  const email = `e2e_${Date.now()}@exemplo.com`;
  const password = 'Senha#Forte123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RabbitMQService)
      .useValue({
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockResolvedValue(true),
        subscribe: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health responde', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect([200, 503]).toContain(res.status); // 503 se o Redis não estiver no ambiente de teste
    expect(res.body.details?.postgres?.status).toBe('up');
  });

  it('rejeita cadastro com senha fraca', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: '123', fullName: 'E2E' })
      .expect(400);
  });

  it('cadastra, faz login e acessa rota protegida', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'Usuário E2E' })
      .expect(201);
    expect(register.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken, refreshToken } = login.body;
    expect(accessToken).toBeDefined();

    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(email);

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(refreshed.body.accessToken).toBeDefined();

    // Reuso do refresh token antigo deve falhar (rotação + detecção de reuso).
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});
