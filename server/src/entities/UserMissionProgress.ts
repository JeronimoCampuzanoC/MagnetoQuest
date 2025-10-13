import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique, Check } from 'typeorm';
import { AppUser } from './AppUser';
import { Mission } from './Mission';

@Entity({ name: 'user_mission_progress' })
@Unique('uq_user_mission', ['user_id', 'mission_id'])
@Check('chk_ump_end_after_start', '(ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)')
@Check('chk_ump_progress_nonneg', 'progress >= 0')
export class UserMissionProgress {
  @PrimaryGeneratedColumn('uuid', { name: 'ump_id' })
  ump_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.mission_progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Index()
  @Column({ name: 'mission_id', type: 'uuid' })
  mission_id!: string;

  @ManyToOne(() => Mission, (m) => m.user_progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id', referencedColumnName: 'mission_id' })
  mission!: Mission;

  // Usa el enum existente en PG: mission_status
  @Column({
    name: 'status',
    type: 'enum',
    enumName: 'mission_status', // referencia tipo existente
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  })
  status!: 'not_started' | 'in_progress' | 'completed';

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  starts_at!: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  ends_at!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completed_at!: Date | null;
}
