import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATALOG_SERVICE, INVENTORY_SERVICE } from '../../contracts';
import { CatalogModule } from '../catalog/catalog.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { IngredientEntity } from './entities/ingredient.entity';
import { RecipeComponentEntity } from './entities/recipe-component.entity';
import { StockLevelEntity } from './entities/stock-level.entity';
import { StockTransactionEntity } from './entities/stock-transaction.entity';

/**
 * Módulo de Estoque — Fase 2 (issue #15).
 *
 * Importa CatalogModule para ter acesso ao CATALOG_SERVICE
 * (ficha técnica referencia produtos do catálogo).
 *
 * Exporta INVENTORY_SERVICE para que OrdersModule o injete
 * ao confirmar pedidos e acionar a baixa automática.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IngredientEntity,
      RecipeComponentEntity,
      StockLevelEntity,
      StockTransactionEntity,
    ]),
    CatalogModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    { provide: INVENTORY_SERVICE, useExisting: InventoryService },
  ],
  exports: [InventoryService, INVENTORY_SERVICE],
})
export class InventoryModule {}
