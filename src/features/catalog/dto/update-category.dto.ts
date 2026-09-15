import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/** Todos os campos de CreateCategoryDto tornam-se opcionais. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
