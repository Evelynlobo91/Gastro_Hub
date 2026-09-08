import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * Perfil complementar do usuário (issue #8).
 * `address` é JSONB — atributos variáveis sem migração de schema.
 */
@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'uuid', name: 'default_brand_id', nullable: true })
  defaultBrandId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  address: Record<string, unknown> | null;

  @Column({ type: 'boolean', name: 'marketing_opt_in', default: false })
  marketingOptIn: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
