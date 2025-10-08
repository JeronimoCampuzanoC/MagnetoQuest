import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AppUser } from './AppUser';

@Entity({ name: 'notification_log' })
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid', { name: 'notification_id' })
  notification_id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => AppUser, (u) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id_app_user' })
  user!: AppUser;

  @Column({ name: 'channel', type: 'text' })
  channel!: string;

  @Column({ name: 'template', type: 'text', nullable: true })
  template!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', default: () => 'now()' })
  sent_at!: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;
}
