import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../contracts';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Rotas do módulo de Catálogo (issues #12/#13 — Fase 2).
 *
 * Visibilidade:
 *  - Leituras públicas (@Public): GET /brands, GET /brands/:id/menu, GET /products/:id
 *  - Escrita restrita a brand_admin ou platform_admin: POST/PATCH/DELETE em categories e products
 */
@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  // ── Marcas (leitura pública) ─────────────────────────────────────────────────

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'Lista todas as marcas ativas' })
  listBrands() {
    return this.catalog.listBrands();
  }

  // ── Cardápio (leitura pública) ───────────────────────────────────────────────

  @Public()
  @Get('brands/:brandId/menu')
  @ApiOperation({ summary: 'Cardápio paginado de uma marca (produtos disponíveis)' })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  getMenu(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Query() query: MenuQueryDto,
  ) {
    return this.catalog.getMenu(brandId, query);
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Detalhe de um produto pelo ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getProduct(id);
  }

  // ── Categorias (admin) ───────────────────────────────────────────────────────

  @Get('brands/:brandId/categories')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lista categorias de uma marca (admin)' })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  listCategories(@Param('brandId', ParseUUIDPipe) brandId: string) {
    return this.catalog.listCategories(brandId);
  }

  @Post('categories')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cria categoria em uma marca (admin)' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('categories/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Atualiza categoria (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove categoria (admin) — falha se houver produtos' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async removeCategory(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.catalog.removeCategory(id);
  }

  // ── Produtos (admin) ─────────────────────────────────────────────────────────

  @Post('products')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cria produto no catálogo (admin)' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Atualiza produto (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove produto (admin) — invalida cache do cardápio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async removeProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.catalog.removeProduct(id);
  }
}
