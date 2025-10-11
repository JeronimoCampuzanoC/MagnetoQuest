import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Resume } from './Resume';
import { Project } from './Project';
import { Certificate } from './Certificate';
import { BadgeProgress } from './BadgeProgress';
import { UserMissionProgress } from './UserMissionProgress';
import { TriviaAttempt } from './TriviaAttempt';
import { NotificationLog } from './NotificationLog';

@Entity({ name: 'app_user' })
export class AppUser {
  @PrimaryGeneratedColumn('uuid', { name: 'id_app_user' })
  id_app_user!: string;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'email', type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'sector', type: 'text', nullable: true })
  sector!: string | null;

  @Column({ name: 'target_position', type: 'text', nullable: true })
  target_position!: string | null;

  @Column({
    name: 'minimum_salary',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v?: string | number | null) => v,
      from: (v: string | null) => (v === null ? null : v),
    },
  })
  minimum_salary!: string | null;

  @Column({ name: 'education_level', type: 'text', nullable: true })
  education_level!: string | null;

  @Column({ name: 'availability', type: 'text', nullable: true })
  availability!: string | null;

  @Column({ name: 'city', type: 'text', nullable: true })
  city!: string | null;

  @OneToMany(() => Resume, (r) => r.user)
  resumes!: Resume[];

  @OneToMany(() => Project, (p) => p.user)
  projects!: Project[];

  @OneToMany(() => Certificate, (c) => c.user)
  certificates!: Certificate[];

  @OneToMany(() => BadgeProgress, (bp) => bp.user)
  badge_progress!: BadgeProgress[];

  @OneToMany(() => UserMissionProgress, (ump) => ump.user)
  mission_progress!: UserMissionProgress[];

  @OneToMany(() => TriviaAttempt, (ta) => ta.user)
  trivia_attempts!: TriviaAttempt[];

  @OneToMany(() => NotificationLog, (nl) => nl.user)
  notifications!: NotificationLog[];
}