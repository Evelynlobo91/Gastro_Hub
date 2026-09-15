import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto, UpdateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { BrandEntity } from '../brands/brand.entity';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

/**
 * CatalogService — CRUD de marcas, categorias e produtos (issue #12/#13).
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepository: Repository<BrandEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  // ─── Brand ──────────────────────────────────────────────────────────────────

  async createBrand(dto: CreateBrandDto): Promise<BrandEntity> {
    const brand = this.brandRepository.create({
      name: dto.name,
      slug: dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: dto.description ?? null,
      logoUrl: dto.logo_url ?? null,
    });
    return this.brandRepository.save(brand);
  }

  async findAllBrands(): Promise<BrandEntity[]> {
    return this.brandRepository.find({ where: { active: true } });
  }

  async findBrandById(id: string): Promise<BrandEntity> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand com ID ${id} não encontrada`);
    return brand;
  }

  async updateBrand(id: string, dto: UpdateBrandDto): Promise<BrandEntity> {
    const brand = await this.findBrandById(id);
    if (dto.name) brand.name = dto.name;
    if (dto.slug) brand.slug = dto.slug;
    if (dto.description !== undefined) brand.description = dto.description ?? null;
    if (dto.logo_url !== undefined) brand.logoUrl = dto.logo_url ?? null;
    return this.brandRepository.save(brand);
  }

  async deleteBrand(id: string): Promise<void> {
    const brand = await this.findBrandById(id);
    await this.brandRepository.softRemove(brand);
  }

  // ─── Category ───────────────────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const category = this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      iconUrl: dto.icon_url,
      parentCategoryId: dto.parent_category_id,
      brandId: dto.brand_id,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(): Promise<CategoryEntity[]> {
    return this.categoryRepository.find({ relations: ['brand'] });
  }

  async findCategoryById(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['brand'],
    });
    if (!category) throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findCategoryById(id);
    if (dto.name) category.name = dto.name;
    if (dto.slug) category.slug = dto.slug;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon_url !== undefined) category.iconUrl = dto.icon_url;
    if (dto.parent_category_id !== undefined) category.parentCategoryId = dto.parent_category_id;
    if (dto.brand_id !== undefined) category.brandId = dto.brand_id;
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);
    await this.categoryRepository.remove(category);
  }

  // ─── Product ─────────────────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto): Promise<ProductEntity> {
    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      priceCents: dto.price_cents,
      stockQuantity: dto.stock_quantity,
      imageUrl: dto.image_url,
      specifications: dto.specifications,
      brandId: dto.brand_id,
      categoryId: dto.category_id,
    });
    return this.productRepository.save(product);
  }

  async findAllProducts(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: { isActive: true },
      relations: ['brand', 'category'],
    });
  }

  async findProductById(id: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['brand', 'category'],
    });
    if (!product) throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findProductById(id);
    if (dto.name) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.price_cents !== undefined) product.priceCents = dto.price_cents;
    if (dto.stock_quantity !== undefined) product.stockQuantity = dto.stock_quantity;
    if (dto.is_active !== undefined) product.isActive = dto.is_active;
    if (dto.image_url !== undefined) product.imageUrl = dto.image_url;
    if (dto.specifications !== undefined) product.specifications = dto.specifications;
    if (dto.brand_id !== undefined) product.brandId = dto.brand_id;
    if (dto.category_id !== undefined) product.categoryId = dto.category_id;
    return this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);
    await this.productRepository.softRemove(product);
  }
}
