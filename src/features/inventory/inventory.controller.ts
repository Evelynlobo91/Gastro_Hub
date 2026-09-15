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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../contracts';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { SetStockMinimumDto } from './dto/set-stock-minimum.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertRecipeComponentDto } from './dto/upsert-recipe-component.dto';
import { InventoryService } from './inventory.service';

/**
 * Rotas do módulo de Estoque (issue #15 — Fase 2).
 *
 * Todas as rotas requerem autenticação (sem @Public).
 * Leituras: brand_admin, platform_admin, kitchen_staff.
 * Escritas: brand_admin, platform_admin.
 */
@ApiBearerAuth()
@ApiTags('inventory')
@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  // ── Ingredientes ─────────────────────────────────────────────────────────────

  @Get('ingredients')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Lista ingredientes (ativos). Filtra por marca + compartilhados.' })
  @ApiQuery({ name: 'brandId', required: false, description: 'UUID da marca (opcional)' })
  listIngredients(@Query('brandId') brandId?: string) {
    return this.inventory.listIngredients(brandId);
  }

  @Post('ingredients')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cria ingrediente (admin)' })
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventory.createIngredient(dto);
  }

  @Patch('ingredients/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Atualiza ingrediente (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateIngredient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventory.updateIngredient(id, dto);
  }

  // ── Ficha técnica ─────────────────────────────────────────────────────────────

  @Get('products/:productId/recipe')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Retorna a ficha técnica de um produto' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  getRecipe(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventory.getRecipe(productId);
  }

  @Post('products/:productId/recipe')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Adiciona ou atualiza componente na ficha técnica (admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  upsertRecipeComponent(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpsertRecipeComponentDto,
  ) {
    return this.inventory.upsertRecipeComponent(productId, dto);
  }

  @Delete('products/:productId/recipe/:ingredientId')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove componente da ficha técnica (admin)' })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiParam({ name: 'ingredientId', format: 'uuid' })
  async removeRecipeComponent(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
  ): Promise<void> {
    await this.inventory.removeRecipeComponent(productId, ingredientId);
  }

  // ── Estoque ───────────────────────────────────────────────────────────────────

  @Get('brands/:brandId/stock/low')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Lista insumos com estoque abaixo do mínimo em uma marca' })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  getLowStock(@Param('brandId', ParseUUIDPipe) brandId: string) {
    return this.inventory.getLowStock(brandId);
  }

  @Post('stock/minimum')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Define ou atualiza estoque mínimo de um insumo em uma marca (admin)' })
  setStockMinimum(@Body() dto: SetStockMinimumDto) {
    return this.inventory.setStockMinimum(dto);
  }

  @Post('stock/adjust')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Movimentação manual de estoque: compra, ajuste ou desperdício (admin)' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventory.adjustStock(dto);
  }
}
