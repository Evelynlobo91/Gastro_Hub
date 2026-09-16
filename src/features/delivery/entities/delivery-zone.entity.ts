import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('delivery_zones')
export class DeliveryZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'varchar', length: 100, nullable: false, name: 'zone_name' })
  zoneName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'min_distance_km' })
  minDistanceKm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, name: 'max_distance_km' })
  maxDistanceKm: number;

  @Column({ type: 'integer', default: 0, nullable: false, name: 'delivery_fee_cents' })
  deliveryFeeCents: number;

  @Column({ type: 'integer', default: 30, nullable: false, name: 'estimated_time_minutes' })
  estimatedTimeMinutes: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
