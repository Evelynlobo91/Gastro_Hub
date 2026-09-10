import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Marca / estabelecimento da praça multimarca (issue #3).
 * Entidade mínima na Fase 0/1 — expandida no módulo de Catálogo (issue #12).
 */
@Entity('brands')
export class BrandEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'citext' })
  slug: string;

  @Column({ type: 'text', name: 'legal_name', nullable: true })
  legalName: string | null;

  /** CNPJ cifrado em repouso (bytea + pgcrypto). */
  @Column({ type: 'bytea', name: 'cnpj_enc', nullable: true, select: false })
  cnpjEnc: Buffer | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
