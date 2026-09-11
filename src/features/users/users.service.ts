import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { PgCryptoService } from '../../shared/crypto/pgcrypto.service';
import {
  CreateUserInput,
  IUsersService,
  UserProfile,
  UserRole,
  UserSummary,
  UUID,
} from '../../contracts';
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(ProfileEntity) private readonly profiles: Repository<ProfileEntity>,
    private readonly dataSource: DataSource,
    private readonly pgcrypto: PgCryptoService,
  ) {}

  async create(input: CreateUserInput): Promise<UserSummary> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = manager.create(UserEntity, {
          email: input.email.toLowerCase().trim(),
          passwordHash: input.passwordHash,
          fullName: input.fullName.trim(),
          role: input.role ?? UserRole.CUSTOMER,
          status: 'pending_verification',
        });
        const saved = await manager.save(user);

        await manager.save(manager.create(ProfileEntity, { userId: saved.id }));

        // CPF e telefone cifrados em repouso via pgcrypto (issue #7 / LGPD).
        await this.pgcrypto.writeEncrypted(manager, 'users', saved.id, {
          cpf_enc: input.cpf ?? undefined,
          phone_enc: input.phone ?? undefined,
        });

        return this.toSummary(saved);
      });
    } catch (err) {
      if (err instanceof QueryFailedError && /uq_users_email|duplicate key/.test(err.message)) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw err;
    }
  }

  async findById(id: UUID): Promise<UserSummary | null> {
    const user = await this.users.findOne({ where: { id } });
    return user ? this.toSummary(user) : null;
  }

  async findByEmailWithSecret(
    email: string,
  ): Promise<(UserSummary & { passwordHash: string }) | null> {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.toLowerCase().trim() })
      .getOne();
    return user ? { ...this.toSummary(user), passwordHash: user.passwordHash } : null;
  }

  async markLoggedIn(id: UUID): Promise<void> {
    await this.users.update(
      { id },
      {
        lastLoginAt: () => 'now()',
        status: 'active',
      },
    );
  }

  async getProfile(userId: UUID): Promise<UserProfile | null> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) return null;
    return {
      birthDate: profile.birthDate,
      defaultBrandId: profile.defaultBrandId,
      address: profile.address,
      marketingOptIn: profile.marketingOptIn,
    };
  }

  /** Decifra os dados sensíveis do usuário — uso restrito (ex.: portal LGPD). */
  async getSensitiveData(userId: UUID): Promise<{ cpf: string | null; phone: string | null }> {
    const exists = await this.users.existsBy({ id: userId });
    if (!exists) throw new NotFoundException('Usuário não encontrado');
    const decrypted = await this.pgcrypto.readEncrypted(this.dataSource.manager, 'users', userId, [
      'cpf_enc',
      'phone_enc',
    ]);
    return {
      cpf: (decrypted.cpf_enc as string | null) ?? null,
      phone: (decrypted.phone_enc as string | null) ?? null,
    };
  }

  private toSummary(user: UserEntity): UserSummary {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
