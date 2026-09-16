import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { BrandEntity } from '../brands/brand.entity';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { CreateBrandDto } from './dto/create-brand.dto';

const mockBrandRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
});

const mockCategoryRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockProductRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softRemove: jest.fn(),
});

describe('CatalogService', () => {
  let service: CatalogService;
  let brandRepository: ReturnType<typeof mockBrandRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(BrandEntity), useFactory: mockBrandRepository },
        { provide: getRepositoryToken(CategoryEntity), useFactory: mockCategoryRepository },
        { provide: getRepositoryToken(ProductEntity), useFactory: mockProductRepository },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    brandRepository = module.get(getRepositoryToken(BrandEntity));
  });

  describe('createBrand', () => {
    it('deve criar uma nova marca com slug auto-gerado', async () => {
      const dto: CreateBrandDto = {
        name: 'Burger King',
        description: 'Rede internacional de fast food',
      };

      const entity = { id: 'uuid', slug: 'burger-king', ...dto };
      brandRepository.create.mockReturnValue(entity);
      brandRepository.save.mockResolvedValue(entity);

      const result = await service.createBrand(dto);

      expect(brandRepository.create).toHaveBeenCalled();
      expect(brandRepository.save).toHaveBeenCalled();
      expect(result).toEqual(entity);
    });
  });

  describe('findAllBrands', () => {
    it('deve retornar todas as marcas ativas', async () => {
      const brands = [{ id: 'uuid-1', name: 'Burger King', active: true }];
      brandRepository.find.mockResolvedValue(brands);

      const result = await service.findAllBrands();

      expect(brandRepository.find).toHaveBeenCalledWith({ where: { active: true } });
      expect(result).toEqual(brands);
    });
  });

  describe('findBrandById', () => {
    it('deve lançar NotFoundException se a marca não existir', async () => {
      brandRepository.findOne.mockResolvedValue(null);

      await expect(service.findBrandById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
