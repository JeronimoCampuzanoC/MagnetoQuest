import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppUser } from './AppUser';

@Entity({ name: 'certificate' })
export class Certificate {
  @PrimaryGeneratedColumn('uuid', { name: 'certificate_id' })
  certificate_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'image', type: 'text', nullable: true })
  image!: string | null;

  @Column({ name: 'validation_link', type: 'text', nullable: true })
  validation_link!: string | null;
}