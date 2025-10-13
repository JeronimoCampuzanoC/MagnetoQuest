import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AppUser } from './AppUser';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  progress_id!: string;

  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @Column('int', { default: 0 })
  streak!: number;

  @Column('boolean', { default: false })
  has_done_today!: boolean;

  @Column('int', { default: 0 })
  magento_points!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}