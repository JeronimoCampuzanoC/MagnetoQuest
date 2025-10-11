import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AppUser } from './AppUser';
import { TriviaQuestion } from './TriviaQuestion';

@Entity({ name: 'trivia_attempt' })
@Unique('uq_user_question', ['user_id', 'question_id'])
export class TriviaAttempt {
  @PrimaryGeneratedColumn('uuid', { name: 'attempt_id' })
  attempt_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.trivia_attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Index()
  @Column({ name: 'question_id', type: 'uuid' })
  question_id!: string;

  @ManyToOne(() => TriviaQuestion, (q) => q.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id', referencedColumnName: 'question_id' })
  question!: TriviaQuestion;

  @Column({ name: 'puntaje', type: 'int' })
  puntaje!: number;

  @Column({ name: 'attempted_at', type: 'timestamptz', default: () => 'now()' })
  attempted_at!: Date;
}
