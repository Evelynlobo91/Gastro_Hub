import { AuditTimestamps, UUID } from './common.contract';
import { UserRole } from './auth.contract';

export const USERS_SERVICE = Symbol('USERS_SERVICE');

/** Visão pública de um usuário — nunca expõe hash de senha nem dados cifrados. */
export interface UserSummary extends AuditTimestamps {
  id: UUID;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'pending_verification' | 'active' | 'suspended';
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
}

export interface UserProfile {
  birthDate: string | null;
  defaultBrandId: UUID | null;
  address: Record<string, unknown> | null;
  marketingOptIn: boolean;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  cpf?: string;
  phone?: string;
  role?: UserRole;
}

export interface IUsersService {
  create(input: CreateUserInput): Promise<UserSummary>;
  findById(id: UUID): Promise<UserSummary | null>;
  findByEmailWithSecret(email: string): Promise<(UserSummary & { passwordHash: string }) | null>;
  markLoggedIn(id: UUID): Promise<void>;
  getProfile(userId: UUID): Promise<UserProfile | null>;
}
