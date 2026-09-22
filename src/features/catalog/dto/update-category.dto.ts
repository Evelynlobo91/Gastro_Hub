import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * brand_id é omitido intencionalmente — não é permitido mover uma categoria
 * para outra marca via PATCH. Para isso, delete e recrie na marca correta.
 */
export class UpdateCategoryDto extends PartialType(OmitType(CreateCategoryDto, ['brand_id'] as const)) {}
