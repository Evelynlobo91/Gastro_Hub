import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { QueryFailedError, Repository } from 'typeorm';
import { REDIS_CLIENT } from '../../shared/cache/redis.provider';
import {
  BrandSummary,
  ICatalogService,
  PaginatedResult,
  PaginationQuery,
  ProductSummary,
  UUID,
} from '../../contracts';
import { BrandEntity } from '../brands/brand.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

/**
 * Implementação do ICatalogService — Fase 2 (issues #12/#13).
 *
 * Cache Redis (best-effort) para leituras de cardápio:
 *   - chave: `catalog:menu:<brandId>:<page>:<pageSize>`
 *   - TTL: 60 s (suficiente para absorver picos sem stale price longo)
 *   - invalidado na escrita de qualquer produto da marca
 *
 * Regras de negócio garantidas tanto no banco (CHECK) quanto aqui:
 *   - priceCents >= 0
 *   - UNIQUE (brand_id, name) em categories → ConflictException 409
 */
@Injectable()
export class CatalogService implements ICatalogService {
  private readonly logger = new Logger(CatalogService.name);

  /** TTL do cache de cardápio em segundos. */
  private static readonly MENU_CACHE_TTL = 60;

  constructor(
    @InjectRepository(BrandEntity)
    private readonly brands: Repository<BrandEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,

    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,

    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // ── ICatalogService ──────────────────────────────────────────────────────────

  /** Lista marcas ativas (usado por Orders e Inventory via contrato). */
  async listBrands(): Promise<BrandSummary[]> {
    const rows = await this.brands.find({
      where: { active: true },
      withDeleted: false,
      order: { name: 'ASC' },
    });
    return rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug, active: b.active }));
  }

  /**
   * Cardápio paginado de uma marca — resultado cacheado no Redis.
   * Apenas produtos `available = true` são retornados (visão pública).
   */
  async getMenu(
    brandId: UUID,
    query: PaginationQuery = {},
  ): Promise<PaginatedResult<ProductSummary>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const cacheKey = `catalog:menu:${brandId}:${page}:${pageSize}`;
    const cached = await this.readCache<PaginatedResult<ProductSummary>>(cacheKey);
    if (cached) return cached;

    await this.assertBrandExists(brandId);

    const [rows, total] = await this.products.findAndCount({
      where: { brandId, available: true },
      order: { category: { sortOrder: 'ASC' }, name: 'ASC' },
      relations: ['category'],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const result: PaginatedResult<ProductSummary> = {
      items: rows.map(this.toProductSummary),
      total,
      page,
      pageSize,
    };

    await this.writeCache(cacheKey, result, CatalogService.MENU_CACHE_TTL);
    return result;
  }

  /** Retorna um produto pelo id (null se não encontrado). */
  async getProduct(productId: UUID): Promise<ProductSummary | null> {
    const product = await this.products.findOne({
      where: { id: productId },
      relations: ['category'],
    });
    return product ? this.toProductSummary(product) : null;
  }

  // ── Categorias (CRUD admin) ──────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto): Promise<CategoryEntity> {
    await this.assertBrandExists(dto.brandId);
    try {
      const entity = this.categories.create({
        brandId: dto.brandId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      });
      return await this.categories.save(entity);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        /uq_categories_brand_name|duplicate key/.test(err.message)
      ) {
        throw new ConflictException(`Categoria "${dto.name}" já existe nesta marca`);
      }
      throw err;
    }
  }

  async updateCategory(id: UUID, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    try {
      Object.assign(category, dto);
      return await this.categories.save(category);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        /uq_categories_brand_name|duplicate key/.test(err.message)
      ) {
        throw new ConflictException(`Já existe uma categoria com este nome nesta marca`);
      }
      throw err;
    }
  }

  async removeCategory(id: UUID): Promise<void> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    await this.categories.remove(category);
  }

  async listCategories(brandId: UUID): Promise<CategoryEntity[]> {
    await this.assertBrandExists(brandId);
    return this.categories.find({
      where: { brandId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // ── Produtos (CRUD admin) ────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto): Promise<ProductEntity> {
    await this.assertBrandExists(dto.brandId);
    await this.assertCategoryBelongsToBrand(dto.categoryId, dto.brandId);

    const entity = this.products.create({
      brandId: dto.brandId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      priceCents: dto.priceCents,
      currency: 'BRL',
      available: dto.available ?? true,
      attributes: dto.attributes ?? {},
    });
    const saved = await this.products.save(entity);
    await this.invalidateMenuCache(dto.brandId);
    return saved;
  }

  async updateProduct(id: UUID, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.assertCategoryBelongsToBrand(dto.categoryId, product.brandId);
    }

    Object.assign(product, {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.priceCents !== undefined && { priceCents: dto.priceCents }),
      ...(dto.available !== undefined && { available: dto.available }),
      ...(dto.attributes !== undefined && { attributes: dto.attributes }),
    });

    const saved = await this.products.save(product);
    await this.invalidateMenuCache(product.brandId);
    return saved;
  }

  async removeProduct(id: UUID): Promise<void> {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    await this.products.remove(product);
    await this.invalidateMenuCache(product.brandId);
  }

  // ── Helpers internos ─────────────────────────────────────────────────────────

  private toProductSummary(product: ProductEntity): ProductSummary {
    return {
      id: product.id,
      brandId: product.brandId,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: { amountCents: product.priceCents, currency: 'BRL' },
      available: product.available,
      attributes: product.attributes,
    };
  }

  private async assertBrandExists(brandId: UUID): Promise<void> {
    const exists = await this.brands.existsBy({ id: brandId, active: true });
    if (!exists) throw new NotFoundException(`Marca "${brandId}" não encontrada ou inativa`);
  }

  private async assertCategoryBelongsToBrand(
    categoryId: UUID,
    brandId: UUID,
  ): Promise<void> {
    const exists = await this.categories.existsBy({ id: categoryId, brandId });
    if (!exists)
      throw new NotFoundException(`Categoria "${categoryId}" não pertence a esta marca`);
  }

  /** Invalida todas as páginas em cache do cardápio de uma marca. */
  private async invalidateMenuCache(brandId: UUID): Promise<void> {
    try {
      const pattern = `catalog:menu:${brandId}:*`;
      let cursor = '0';
      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Falha ao invalidar cache de cardápio: ${(err as Error).message}`);
    }
  }

  private async readCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      this.logger.warn(`Cache miss (erro Redis): ${(err as Error).message}`);
      return null;
    }
  }

  private async writeCache<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Falha ao gravar cache: ${(err as Error).message}`);
    }
  }
}
