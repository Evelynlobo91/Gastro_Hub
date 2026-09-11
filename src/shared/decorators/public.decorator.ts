import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca uma rota como aberta — o JwtAuthGuard global não a exige (issue #9). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
