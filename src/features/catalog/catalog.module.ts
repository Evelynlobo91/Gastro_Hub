import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { BrandEntity } from '../brands/brand.entity';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

/**
 * CatalogModule — Fase 2 (issue #12/#13).
 * Gestão de marcas, categorias e produtos da praça multimarca.
 * Usa BrandEntity já existente (issue #3) e adiciona Category + Product.
 */
@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, CategoryEntity, ProductEntity])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
