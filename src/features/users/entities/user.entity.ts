import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../contracts';
import { ProfileEntity } from './profile.entity';

export type UserStatus = 'pending_verification' | 'active' | 'suspended';

/**
 * Usuário da plataforma (issues #7/#8).
 * Dados sensíveis (CPF, telefone) ficam em colunas `*_enc` (bytea) cifradas via
 * pgcrypto — nunca são lidas/escritas por esta entidade diretamente, e sim pelo
 * PgCryptoService. `passwordHash` é Argon2 e tem `select: false`.
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({ type: 'text', name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'text', name: 'full_name' })
  fullName: string;

  @Column({ type: 'bytea', name: 'cpf_enc', nullable: true, select: false })
  cpfEnc: Buffer | null;

  @Column({ type: 'bytea', name: 'phone_enc', nullable: true, select: false })
  phoneEnc: Buffer | null;

  @Index('idx_users_role')
  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.CUSTOMER })
  role: UserRole;

  @Index('idx_users_status')
  @Column({
    type: 'enum',
    enumName: 'user_status',
    enum: ['pending_verification', 'active', 'suspended'],
    default: 'pending_verification',
  })
  status: UserStatus;

  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => ProfileEntity, (profile) => profile.user)
  profile?: ProfileEntity;
}
