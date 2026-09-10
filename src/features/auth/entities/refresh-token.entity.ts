import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Registro durável de refresh tokens (issue #7 — sessão stateless com rotação).
 * Guarda apenas o SHA-256 do token. O cache "quente" da sessão fica no Redis
 * (issue #11); esta tabela é a fonte de verdade para revogação e detecção de reuso.
 */
@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_refresh_tokens_user')
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'token_hash', unique: true })
  tokenHash: string;

  @Index('idx_refresh_tokens_family')
  @Column({ type: 'uuid', name: 'family_id' })
  familyId: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
