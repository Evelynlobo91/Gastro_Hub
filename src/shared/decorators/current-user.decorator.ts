import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../contracts';

/** Injeta `request.user` (populado pelo JwtAuthGuard) no handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    return data && user ? user[data] : user;
  },
);
