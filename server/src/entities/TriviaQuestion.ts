import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TriviaAttempt } from './TriviaAttempt';

@Entity({ name: 'trivia_question' })
export class TriviaQuestion {
  @PrimaryGeneratedColumn('uuid', { name: 'question_id' })
  question_id!: string;

  @Column({ name: 'category', type: 'text', nullable: true })
  category!: string | null;

  @Column({
    name: 'difficulty',
    type: 'enum',
    enumName: 'difficulty', // usa el enum ya creado en PG
    enum: ['easy', 'medium', 'hard'],
    default: 'easy',
  })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Column({ name: 'question', type: 'text' })
  question!: string;

  @Column({ name: 'answer', type: 'text' })
  answer!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @OneToMany(() => TriviaAttempt, (ta) => ta.question)
  attempts!: TriviaAttempt[];
}
