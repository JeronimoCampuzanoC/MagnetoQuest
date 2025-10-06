import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'app_user' })
export class AppUser {
  @PrimaryGeneratedColumn('uuid', { name: 'id_app_user' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  sector?: string;

  @Column({ type: 'text', nullable: true })
  target_position?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  minimum_salary?: number;

  @Column({ type: 'text', nullable: true })
  education_level?: string;

  @Column({ type: 'text', nullable: true })
  availability?: string;

  @Column({ type: 'text', nullable: true })
  city?: string;
}