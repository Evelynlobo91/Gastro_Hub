import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * brandId é omitido intencionalmente — não é permitido mover uma categoria
 * para outra marca via PATCH. Para isso, delete e recrie na marca correta.
 */
export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ['brandId'] as const)) {}
