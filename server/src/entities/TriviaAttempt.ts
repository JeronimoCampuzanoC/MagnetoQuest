import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppUser } from './AppUser';


@Entity({ name: 'trivia_attempt' })
export class TriviaAttempt {
  @PrimaryGeneratedColumn('uuid', { name: 'attempt_id' })
  attempt_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.trivia_attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  @Column({
    name: 'difficulty',
    type: 'enum',
    enumName: 'difficulty',
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Column({ name: 'score', type: 'int' })
  score!: number;

  @Column({ name: 'total_time', type: 'int' })
  total_time!: number;

  @Column({ name: 'precision_score', type: 'int' })
  precision_score!: number;

  @Column({ name: 'attempted_at', type: 'timestamptz', default: () => 'now()' })
  attempted_at!: Date;
}
