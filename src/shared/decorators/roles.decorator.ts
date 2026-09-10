import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../contracts';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos papéis informados (usado com o RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
