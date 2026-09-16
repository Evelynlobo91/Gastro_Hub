import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Connection, Channel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  public static readonly EXCHANGE_ORDERS = 'gastrohub.orders';
  public static readonly EXCHANGE_DELIVERY = 'gastrohub.delivery';
  public static readonly QUEUE_ORDERS = 'orders_queue';
  public static readonly QUEUE_DELIVERY = 'delivery_queue';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel) {
        await (this.channel as any).close();
      }
      if (this.connection) {
        await (this.connection as any).close();
      }
      this.logger.log('Conexão com RabbitMQ encerrada com sucesso.');
    } catch (error) {
      this.logger.error('Erro ao fechar conexão com RabbitMQ:', error);
    }
  }

  private async connectWithRetry(retries = 5, delayMs = 3000): Promise<void> {
    const url =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://gastrohub:gastrohub@rabbitmq:5672';

    for (let i = 1; i <= retries; i++) {
      try {
        this.logger.log(`Tentando conectar ao RabbitMQ (${url}) - Tentativa ${i}/${retries}...`);
        const conn: any = await connect(url);
        this.connection = conn;
        const ch: any = await conn.createChannel();
        this.channel = ch;

        await ch.assertExchange(RabbitMQService.EXCHANGE_ORDERS, 'topic', { durable: true });
        await ch.assertExchange(RabbitMQService.EXCHANGE_DELIVERY, 'topic', { durable: true });

        await ch.assertQueue(RabbitMQService.QUEUE_ORDERS, { durable: true });
        await ch.assertQueue(RabbitMQService.QUEUE_DELIVERY, { durable: true });

        await ch.bindQueue(
          RabbitMQService.QUEUE_ORDERS,
          RabbitMQService.EXCHANGE_ORDERS,
          'orders.#',
        );
        await ch.bindQueue(
          RabbitMQService.QUEUE_DELIVERY,
          RabbitMQService.EXCHANGE_DELIVERY,
          'delivery.#',
        );

        this.logger.log('Conectado ao RabbitMQ e filas configuradas com sucesso.');

        conn.on('error', (err: any) => {
          this.logger.error('Erro na conexão com RabbitMQ:', err);
        });

        conn.on('close', () => {
          this.logger.warn('Conexão com RabbitMQ fechada.');
        });

        return;
      } catch (error: any) {
        this.logger.warn(`Falha na conexão com RabbitMQ (tentativa ${i}/${retries}): ${error.message}`);
        if (i === retries) {
          this.logger.error('Não foi possível conectar ao RabbitMQ após várias tentativas.');
        } else {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ não conectado. Impossível publicar em ${exchange}/${routingKey}`);
      return false;
    }
    try {
      const payload = Buffer.from(JSON.stringify(message));
      const published = (this.channel as any).publish(exchange, routingKey, payload, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });
      this.logger.log(`Evento publicado [${exchange} -> ${routingKey}]`);
      return published;
    } catch (error) {
      this.logger.error(`Erro ao publicar evento [${exchange} -> ${routingKey}]:`, error);
      return false;
    }
  }

  async subscribe(
    queue: string,
    onMessage: (content: any, rawMessage: ConsumeMessage) => Promise<void> | void,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ não conectado. Impossível consumir da fila ${queue}`);
      return;
    }

    try {
      await (this.channel as any).consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const content = JSON.parse(msg.content.toString());
          await onMessage(content, msg);
          (this.channel as any)?.ack(msg);
        } catch (err) {
          this.logger.error(`Erro ao processar mensagem da fila ${queue}:`, err);
          (this.channel as any)?.nack(msg, false, false);
        }
      });
      this.logger.log(`Inscrito na fila RabbitMQ: ${queue}`);
    } catch (error) {
      this.logger.error(`Erro ao se inscrever na fila ${queue}:`, error);
    }
  }
}
