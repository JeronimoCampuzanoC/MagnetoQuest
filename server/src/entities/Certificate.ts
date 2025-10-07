import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppUser } from './AppUser';

@Entity('certificate')
export class Certificate {
  @PrimaryGeneratedColumn('uuid', { name: 'certificate_id' })
  certificateId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'title', type: 'text' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'image', type: 'text', nullable: true })
  image!: string;

  @Column({ name: 'validation_link', type: 'text', nullable: true })
  validationLink!: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;
}