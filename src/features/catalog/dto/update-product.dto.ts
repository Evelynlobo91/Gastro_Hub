import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/** Todos os campos de CreateProductDto tornam-se opcionais. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
