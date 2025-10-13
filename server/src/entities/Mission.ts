import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Check } from 'typeorm';
import { UserMissionProgress } from './UserMissionProgress';

export enum MissionStatus { // solo para tipos si quisieras usarlo en código
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity({ name: 'mission' })
@Check('chk_mission_xp_nonneg', 'xp_reward >= 0')
@Check('chk_mission_objective_positive', 'objective >= 1')
export class Mission {
  @PrimaryGeneratedColumn('uuid', { name: 'mission_id' })
  mission_id!: string;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  @Column({ name: 'xp_reward', type: 'int', default: 10 })
  xp_reward!: number;

  @Column({ name: 'objective', type: 'int', default: 1 })
  objective!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @OneToMany(() => UserMissionProgress, (ump) => ump.mission)
  user_progress!: UserMissionProgress[];
}
