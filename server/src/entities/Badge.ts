import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Check } from 'typeorm';
import { BadgeProgress } from './BadgeProgress';

export enum CategoryType {
  Trivia = 'Trivia',
  Streak = 'Streak',
  MagnetoPoints = 'MagnetoPoints',
  CV = 'CV',
}

@Entity({ name: 'badge' })
@Check('chk_badge_score_nonneg', 'badge_score >= 0')
@Check('chk_badge_quantity_nonneg', '(quantity IS NULL OR quantity >= 0)')
export class Badge {
  @PrimaryGeneratedColumn('uuid', { name: 'badge_id' })
  badge_id!: string;

  @Column({ name: 'badge_name', type: 'text' })
  badge_name!: string;

  @Column({ name: 'badge_score', type: 'int' })
  badge_score!: number;

  @Column({
    name: 'category',
    type: 'enum',
    enum: CategoryType,
    enumName: 'category_type',
    nullable: true,
  })
  category!: CategoryType | null;

  @Column({ name: 'parameter', type: 'text', nullable: true })
  parameter!: string | null;

  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity!: number | null;

  @OneToMany(() => BadgeProgress, (bp) => bp.badge)
  progresses!: BadgeProgress[];
}