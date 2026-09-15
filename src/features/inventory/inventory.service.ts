import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ConsumeStockCommand,
  IInventoryService,
  RecipeComponent,
  StockLevel,
  UUID,
} from '../../contracts';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { SetStockMinimumDto } from './dto/set-stock-minimum.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertRecipeComponentDto } from './dto/upsert-recipe-component.dto';
import { IngredientEntity } from './entities/ingredient.entity';
import { RecipeComponentEntity } from './entities/recipe-component.entity';
import { StockLevelEntity } from './entities/stock-level.entity';
import { StockTransactionEntity } from './entities/stock-transaction.entity';

/**
 * Implementação do IInventoryService — Fase 2 (issue #15).
 *
 * consumeForOrder() executa em transação ACID única:
 *   1. Lê a ficha técnica de cada produto (recipe_components)
 *   2. Calcula a baixa por ingrediente agrupando todos os itens do pedido
 *   3. Atualiza stock_levels com SELECT ... FOR UPDATE (evita race condition)
 *   4. Registra uma stock_transaction por stock_level movimentado
 *
 * Regra de negócio: estoque não pode ficar negativo — lança BadRequestException
 * com lista dos insumos insuficientes antes de qualquer escrita.
 */
@Injectable()
export class InventoryService implements IInventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(IngredientEntity)
    private readonly ingredients: Repository<IngredientEntity>,

    @InjectRepository(RecipeComponentEntity)
    private readonly recipeComponents: Repository<RecipeComponentEntity>,

    @InjectRepository(StockLevelEntity)
    private readonly stockLevels: Repository<StockLevelEntity>,

    @InjectRepository(StockTransactionEntity)
    private readonly stockTransactions: Repository<StockTransactionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  // ── IInventoryService ────────────────────────────────────────────────────────

  /** Retorna a ficha técnica (ingredientes + quantidades) de um produto. */
  async getRecipe(productId: UUID): Promise<RecipeComponent[]> {
    const rows = await this.recipeComponents.find({
      where: { productId },
      relations: ['ingredient'],
    });
    return rows.map((r) => ({
      ingredientId: r.ingredientId,
      quantity: Number(r.quantity),
      unit: r.unit,
    }));
  }

  /**
   * Baixa automática de estoque para um conjunto de itens de pedido.
   * Executado dentro de uma transação ACID — falha total ou sucesso total.
   */
  async consumeForOrder(commands: ConsumeStockCommand[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Agrupa consumo por (brandId, ingredientId)
      const consumptionMap = new Map<string, { brandId: UUID; ingredientId: UUID; total: number }>();

      for (const cmd of commands) {
        const recipe = await manager.find(RecipeComponentEntity, {
          where: { productId: cmd.productId },
        });
        for (const component of recipe) {
          const key = `${cmd.brandId}:${component.ingredientId}`;
          const existing = consumptionMap.get(key);
          const delta = Number(component.quantity) * cmd.quantity;
          if (existing) {
            existing.total += delta;
          } else {
            consumptionMap.set(key, {
              brandId: cmd.brandId,
              ingredientId: component.ingredientId,
              total: delta,
            });
          }
        }
      }

      // Valida disponibilidade antes de qualquer escrita
      const insufficient: string[] = [];
      for (const entry of consumptionMap.values()) {
        const level = await manager
          .createQueryBuilder(StockLevelEntity, 'sl')
          .setLock('pessimistic_write')
          .where('sl.ingredient_id = :iid AND sl.brand_id = :bid', {
            iid: entry.ingredientId,
            bid: entry.brandId,
          })
          .getOne();

        if (!level || Number(level.onHand) < entry.total) {
          insufficient.push(entry.ingredientId);
        }
      }

      if (insufficient.length > 0) {
        throw new BadRequestException(
          `Estoque insuficiente para os insumos: ${insufficient.join(', ')}`,
        );
      }

      // Aplica baixas e registra transações
      const orderId = commands[0]?.orderId ?? null;
      for (const entry of consumptionMap.values()) {
        const level = await manager
          .createQueryBuilder(StockLevelEntity, 'sl')
          .setLock('pessimistic_write')
          .where('sl.ingredient_id = :iid AND sl.brand_id = :bid', {
            iid: entry.ingredientId,
            bid: entry.brandId,
          })
          .getOne();

        if (!level) continue;

        const newOnHand = Number(level.onHand) - entry.total;
        await manager.update(StockLevelEntity, level.id, { onHand: newOnHand });

        await manager.insert(StockTransactionEntity, {
          stockLevelId: level.id,
          orderId,
          type: 'consumption',
          quantity: -entry.total,
          balanceAfter: newOnHand,
        });
      }

      this.logger.log(`Baixa de estoque para pedido ${orderId} — ${consumptionMap.size} insumo(s)`);
    });
  }

  /** Lista insumos com estoque abaixo do mínimo para uma marca. */
  async getLowStock(brandId: UUID): Promise<StockLevel[]> {
    const rows = await this.dataSource
      .createQueryBuilder(StockLevelEntity, 'sl')
      .where('sl.brand_id = :brandId', { brandId })
      .andWhere('sl.on_hand < sl.minimum')
      .getMany();

    return rows.map((r) => ({
      ingredientId: r.ingredientId,
      brandId: r.brandId,
      onHand: Number(r.onHand),
      minimum: Number(r.minimum),
      belowMinimum: true,
    }));
  }

  // ── Ingredientes (CRUD admin) ────────────────────────────────────────────────

  async createIngredient(dto: CreateIngredientDto): Promise<IngredientEntity> {
    const entity = this.ingredients.create({
      brandId: dto.brandId ?? null,
      name: dto.name,
      baseUnit: dto.baseUnit,
      active: dto.active ?? true,
    });
    return this.ingredients.save(entity);
  }

  async updateIngredient(id: UUID, dto: UpdateIngredientDto): Promise<IngredientEntity> {
    const ingredient = await this.ingredients.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado');
    Object.assign(ingredient, dto);
    return this.ingredients.save(ingredient);
  }

  async listIngredients(brandId?: UUID): Promise<IngredientEntity[]> {
    const qb = this.ingredients
      .createQueryBuilder('i')
      .where('i.active = true')
      .orderBy('i.name', 'ASC');

    if (brandId) {
      // Retorna insumos da marca + insumos compartilhados (brand_id IS NULL)
      qb.andWhere('(i.brand_id = :brandId OR i.brand_id IS NULL)', { brandId });
    }

    return qb.getMany();
  }

  // ── Ficha técnica (CRUD admin) ───────────────────────────────────────────────

  async upsertRecipeComponent(
    productId: UUID,
    dto: UpsertRecipeComponentDto,
  ): Promise<RecipeComponentEntity> {
    const existing = await this.recipeComponents.findOne({
      where: { productId, ingredientId: dto.ingredientId },
    });

    if (existing) {
      existing.quantity = dto.quantity;
      existing.unit = dto.unit;
      return this.recipeComponents.save(existing);
    }

    const entity = this.recipeComponents.create({
      productId,
      ingredientId: dto.ingredientId,
      quantity: dto.quantity,
      unit: dto.unit,
    });
    return this.recipeComponents.save(entity);
  }

  async removeRecipeComponent(productId: UUID, ingredientId: UUID): Promise<void> {
    const component = await this.recipeComponents.findOne({
      where: { productId, ingredientId },
    });
    if (!component) throw new NotFoundException('Componente de ficha técnica não encontrado');
    await this.recipeComponents.remove(component);
  }

  // ── Estoque (operações admin) ────────────────────────────────────────────────

  async setStockMinimum(dto: SetStockMinimumDto): Promise<StockLevelEntity> {
    let level = await this.stockLevels.findOne({
      where: { ingredientId: dto.ingredientId, brandId: dto.brandId },
    });

    if (!level) {
      level = this.stockLevels.create({
        ingredientId: dto.ingredientId,
        brandId: dto.brandId,
        onHand: 0,
        minimum: dto.minimum,
      });
    } else {
      level.minimum = dto.minimum;
    }

    return this.stockLevels.save(level);
  }

  async adjustStock(dto: AdjustStockDto): Promise<StockTransactionEntity> {
    return this.dataSource.transaction(async (manager) => {
      let level = await manager.findOne(StockLevelEntity, {
        where: { ingredientId: dto.ingredientId, brandId: dto.brandId },
      });

      if (!level) {
        level = manager.create(StockLevelEntity, {
          ingredientId: dto.ingredientId,
          brandId: dto.brandId,
          onHand: 0,
          minimum: 0,
        });
        level = await manager.save(level);
      }

      // Sinal: purchase = positivo; waste/adjustment = o chamador decide (pode ser neg)
      const delta = dto.type === 'waste' ? -Math.abs(dto.quantity) : dto.quantity;
      const newOnHand = Number(level.onHand) + delta;

      if (newOnHand < 0) {
        throw new BadRequestException('Ajuste resultaria em estoque negativo');
      }

      await manager.update(StockLevelEntity, level.id, { onHand: newOnHand });

      const tx = manager.create(StockTransactionEntity, {
        stockLevelId: level.id,
        orderId: dto.orderId ?? null,
        type: dto.type,
        quantity: delta,
        balanceAfter: newOnHand,
      });
      return manager.save(tx);
    });
  }
}
