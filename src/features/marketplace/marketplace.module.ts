import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLevelEntity } from '../inventory/entities/stock-level.entity';
import { StockTransactionEntity } from '../inventory/entities/stock-transaction.entity';
import { BrandTransferEntity } from './entities/brand-transfer.entity';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

/**
 * Marketplace Interno — Fase 3 (issues #20/#23).
 *
 * Importa StockLevelEntity e StockTransactionEntity diretamente
 * (sem importar InventoryModule) para executar a movimentação ACID
 * de estoque na confirmação de recebimento.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandTransferEntity,
      StockLevelEntity,
      StockTransactionEntity,
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
