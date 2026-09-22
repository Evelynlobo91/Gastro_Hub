import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { BrandEntity } from '../brands/brand.entity';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Brands ─────────────────────────────────────────────────────────────────

  @Post('brands')
  @ApiOperation({ summary: 'Criar nova marca' })
  @ApiCreatedResponse({ type: BrandEntity })
  async createBrand(@Body() createBrandDto: CreateBrandDto): Promise<BrandEntity> {
    return this.catalogService.createBrand(createBrandDto);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listar todas as marcas ativas' })
  @ApiOkResponse({ type: [BrandEntity] })
  async findAllBrands(): Promise<BrandEntity[]> {
    return this.catalogService.findAllBrands();
  }

  @Get('brands/:id')
  @ApiOperation({ summary: 'Buscar marca por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandEntity })
  @ApiNotFoundResponse({ description: 'Marca não encontrada' })
  async findBrand(@Param('id', ParseUUIDPipe) id: string): Promise<BrandEntity> {
    return this.catalogService.findBrandById(id);
  }

  @Put('brands/:id')
  @ApiOperation({ summary: 'Atualizar marca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandEntity })
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<BrandEntity> {
    return this.catalogService.updateBrand(id, updateBrandDto);
  }

  @Delete('brands/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar marca (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async deleteBrand(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.catalogService.deleteBrand(id);
  }

  // ─── Categories ──────────────────────────────────────────────────────────────

  @Post('categories')
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiCreatedResponse({ type: CategoryEntity })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    return this.catalogService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar todas as categorias' })
  @ApiOkResponse({ type: [CategoryEntity] })
  async findAllCategories(): Promise<CategoryEntity[]> {
    return this.catalogService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CategoryEntity })
  @ApiNotFoundResponse({ description: 'Categoria não encontrada' })
  async findCategory(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryEntity> {
    return this.catalogService.findCategoryById(id);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    return this.catalogService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover categoria' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.catalogService.deleteCategory(id);
  }

  // ─── Products ────────────────────────────────────────────────────────────────

  @Post('products')
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiCreatedResponse({ type: ProductEntity })
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<ProductEntity> {
    return this.catalogService.createProduct(createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar todos os produtos ativos' })
  @ApiOkResponse({ type: [ProductEntity] })
  async findAllProducts(): Promise<ProductEntity[]> {
    return this.catalogService.findAllProducts();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductEntity })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  async findProduct(@Param('id', ParseUUIDPipe) id: string): Promise<ProductEntity> {
    return this.catalogService.findProductById(id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    return this.catalogService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover produto (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.catalogService.deleteProduct(id);
  }
}
