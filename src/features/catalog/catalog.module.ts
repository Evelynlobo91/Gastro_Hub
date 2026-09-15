import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATALOG_SERVICE } from '../../contracts';
import { BrandEntity } from '../brands/brand.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

/**
 * Módulo de Catálogo — Fase 2 (issues #12/#13).
 *
 * Exporta CATALOG_SERVICE para que OrdersModule e InventoryModule
 * consumam ICatalogService sem importar CatalogService diretamente
 * (regra de arquitetura: comunicação apenas via contratos).
 *
 * CacheModule e REDIS_CLIENT já são globais (providos por CacheModule @Global),
 * por isso não precisam ser re-importados aqui.
 */
@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, CategoryEntity, ProductEntity])],
  controllers: [CatalogController],
  providers: [CatalogService, { provide: CATALOG_SERVICE, useExisting: CatalogService }],
  exports: [CatalogService, CATALOG_SERVICE],
})
export class CatalogModule {}
