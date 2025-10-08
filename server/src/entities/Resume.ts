import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppUser } from './AppUser';

@Entity({ name: 'resume' })
export class Resume {
  @PrimaryGeneratedColumn('uuid', { name: 'id_resume' })
  id_resume!: string;

  @Index()
  @Column({ name: 'id_app_user', type: 'uuid' })
  id_app_user!: string;

  @ManyToOne(() => AppUser, (u) => u.resumes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_app_user', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'experience', type: 'text', nullable: true })
  experience!: string | null;

  @Column({ name: 'courses', type: 'text', nullable: true })
  courses!: string | null;

  @Column({ name: 'projects', type: 'text', nullable: true })
  projects!: string | null;

  @Column({ name: 'languages', type: 'text', nullable: true })
  languages!: string | null;

  @Column({ name: 'references_cv', type: 'text', nullable: true })
  references_cv!: string | null;
}