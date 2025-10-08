import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppUser } from './AppUser';

@Entity({ name: 'project' })
export class Project {
  @PrimaryGeneratedColumn('uuid', { name: 'project_id' })
  project_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'url', type: 'text', nullable: true })
  url!: string | null;

  @Column({ name: 'preview_image', type: 'text', nullable: true })
  preview_image!: string | null;

  @Column({ name: 'document', type: 'text', nullable: true })
  document!: string | null;

  @Column({ name: 'project_date', type: 'date', nullable: true })
  project_date!: Date | null;
}