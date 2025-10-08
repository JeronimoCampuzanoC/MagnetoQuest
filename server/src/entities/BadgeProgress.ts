import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique, Check } from 'typeorm';
import { AppUser } from './AppUser';
import { Badge } from './Badge';

@Entity({ name: 'badge_progress' })
@Unique('uq_user_badge', ['user_id', 'badge_id'])
@Check('chk_badge_progress_nonneg', 'progress >= 0')
export class BadgeProgress {
  @PrimaryGeneratedColumn('uuid', { name: 'progress_id' })
  progress_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.badge_progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Index()
  @Column({ name: 'badge_id', type: 'uuid' })
  badge_id!: string;

  @ManyToOne(() => Badge, (b) => b.progresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id', referencedColumnName: 'badge_id' })
  badge!: Badge;

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'awarded_at', type: 'timestamptz', nullable: true })
  awarded_at!: Date | null;
}