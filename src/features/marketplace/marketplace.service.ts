import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UUID } from '../../contracts';
import { StockLevelEntity } from '../inventory/entities/stock-level.entity';
import { StockTransactionEntity } from '../inventory/entities/stock-transaction.entity';
import { CreateBrandTransferDto } from './dto/create-brand-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { BrandTransferEntity } from './entities/brand-transfer.entity';

/**
 * Marketplace interno — transferência de insumos entre marcas (issues #20/#23 — Fase 3).
 *
 * Fluxo de uma transferência:
 *   1. Marca origem solicita (status: requested)
 *   2. Marca destino aprova (status: approved)
 *   3. Insumo é enviado (status: shipped)
 *   4. Marca destino confirma recebimento (status: received)
 *      → ACID: desconta stock_level da origem, credita stock_level do destino,
 *              registra stock_transactions em ambos os lados
 *   OU
 *   4b. Transferência é rejeitada (status: rejected) — sem movimentação de estoque
 *
 * Regra central do projeto garantida no banco e no service:
 *   transfer_price_cents > unit_cost_cents
 */
@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(BrandTransferEntity)
    private readonly transfers: Repository<BrandTransferEntity>,

    @InjectRepository(StockLevelEntity)
    private readonly stockLevels: Repository<StockLevelEntity>,

    @InjectRepository(StockTransactionEntity)
    private readonly stockTransactions: Repository<StockTransactionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /** Solicita uma transferência de insumo entre marcas. */
  async requestTransfer(dto: CreateBrandTransferDto): Promise<BrandTransferEntity> {
    if (dto.fromBrandId === dto.toBrandId) {
      throw new BadRequestException('Marca origem e destino não podem ser iguais');
    }
    if (dto.transferPriceCents <= dto.unitCostCents) {
      throw new BadRequestException(
        'Preço de transferência deve ser maior que o custo unitário',
      );
    }

    // Verifica se a marca origem tem estoque suficiente
    const fromLevel = await this.stockLevels.findOne({
      where: { ingredientId: dto.ingredientId, brandId: dto.fromBrandId },
    });
    if (!fromLevel || Number(fromLevel.onHand) < dto.quantity) {
      throw new BadRequestException('Estoque insuficiente na marca origem para esta transferência');
    }

    const transfer = this.transfers.create({
      fromBrandId: dto.fromBrandId,
      toBrandId: dto.toBrandId,
      ingredientId: dto.ingredientId,
      quantity: dto.quantity,
      unitCostCents: dto.unitCostCents,
      transferPriceCents: dto.transferPriceCents,
      status: 'requested',
    });

    return this.transfers.save(transfer);
  }

  /**
   * Atualiza o status de uma transferência.
   * Quando status = 'received': executa movimentação ACID de estoque.
   */
  async updateStatus(
    transferId: UUID,
    dto: UpdateTransferStatusDto,
  ): Promise<BrandTransferEntity> {
    const transfer = await this.transfers.findOne({ where: { id: transferId } });
    if (!transfer) throw new NotFoundException('Transferência não encontrada');

    this.validateStatusTransition(transfer.status, dto.status);

    if (dto.status === 'received') {
      return this.executeTransferACID(transfer);
    }

    transfer.status = dto.status;
    return this.transfers.save(transfer);
  }

  /** Lista transferências de uma marca (como origem ou destino). */
  async listTransfers(brandId: UUID): Promise<BrandTransferEntity[]> {
    return this.transfers
      .createQueryBuilder('bt')
      .where('bt.fromBrandId = :brandId OR bt.toBrandId = :brandId', { brandId })
      .orderBy('bt.createdAt', 'DESC')
      .getMany();
  }

  /** Busca uma transferência pelo ID. */
  async getTransfer(transferId: UUID): Promise<BrandTransferEntity> {
    const transfer = await this.transfers.findOne({ where: { id: transferId } });
    if (!transfer) throw new NotFoundException('Transferência não encontrada');
    return transfer;
  }

  // ── Internos ─────────────────────────────────────────────────────────────────

  /**
   * Executa a movimentação de estoque em transação ACID quando a transferência
   * é confirmada como recebida.
   *
   * - Desconta stock_level da marca origem (transfer_out)
   * - Credita stock_level da marca destino (transfer_in)
   * - Registra stock_transaction em ambos os lados
   */
  private async executeTransferACID(
    transfer: BrandTransferEntity,
  ): Promise<BrandTransferEntity> {
    return this.dataSource.transaction(async (manager) => {
      // Bloqueia os dois stock_levels para evitar race condition
      const fromLevel = await manager
        .createQueryBuilder(StockLevelEntity, 'sl')
        .setLock('pessimistic_write')
        .where('sl.ingredientId = :iid AND sl.brandId = :bid', {
          iid: transfer.ingredientId,
          bid: transfer.fromBrandId,
        })
        .getOne();

      if (!fromLevel || Number(fromLevel.onHand) < Number(transfer.quantity)) {
        throw new BadRequestException(
          'Estoque insuficiente na marca origem no momento da confirmação',
        );
      }

      // Cria ou bloqueia stock_level da marca destino
      let toLevel = await manager
        .createQueryBuilder(StockLevelEntity, 'sl')
        .setLock('pessimistic_write')
        .where('sl.ingredientId = :iid AND sl.brandId = :bid', {
          iid: transfer.ingredientId,
          bid: transfer.toBrandId,
        })
        .getOne();

      if (!toLevel) {
        toLevel = manager.create(StockLevelEntity, {
          ingredientId: transfer.ingredientId,
          brandId: transfer.toBrandId,
          onHand: 0,
          minimum: 0,
        });
        toLevel = await manager.save(toLevel);
      }

      const qty = Number(transfer.quantity);
      const fromNew = Number(fromLevel.onHand) - qty;
      const toNew = Number(toLevel.onHand) + qty;

      // Atualiza saldos
      await manager.update(StockLevelEntity, fromLevel.id, { onHand: fromNew });
      await manager.update(StockLevelEntity, toLevel.id, { onHand: toNew });

      // Registra transações nos dois lados
      await manager.insert(StockTransactionEntity, {
        stockLevelId: fromLevel.id,
        orderId: null,
        type: 'transfer_out',
        quantity: -qty,
        balanceAfter: fromNew,
      });
      await manager.insert(StockTransactionEntity, {
        stockLevelId: toLevel.id,
        orderId: null,
        type: 'transfer_in',
        quantity: qty,
        balanceAfter: toNew,
      });

      // Atualiza status da transferência
      await manager.update(BrandTransferEntity, transfer.id, { status: 'received' });

      this.logger.log(
        `Transferência ${transfer.id} concluída — ${qty} de ingrediente ${transfer.ingredientId}`,
      );

      return { ...transfer, status: 'received' };
    });
  }

  /** Valida se a transição de status é permitida. */
  private validateStatusTransition(
    current: BrandTransferEntity['status'],
    next: BrandTransferEntity['status'],
  ): void {
    const allowed: Record<string, string[]> = {
      requested: ['approved', 'rejected'],
      approved: ['shipped', 'rejected'],
      shipped: ['received', 'rejected'],
      received: [],
      rejected: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Transição de status inválida: ${current} → ${next}`,
      );
    }
  }
}
