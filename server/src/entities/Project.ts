import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppUser } from './AppUser';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid', { name: 'project_id' })
  projectId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url!: string;

  @Column({ name: 'preview_image', type: 'text', nullable: true })
  previewImage!: string;

  @Column({ name: 'document', type: 'text', nullable: true })
  document!: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;
}