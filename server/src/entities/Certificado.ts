import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity({ name: 'certificado' })
export class Certificado {
  @PrimaryGeneratedColumn('uuid', { name: 'id_certificado' })
  id_certificado!: string;

  @Index()
  @Column({ name: 'id_usuario', type: 'uuid' })
  id_usuario!: string;

  @ManyToOne(() => Usuario, (u) => u.certificados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario!: Usuario;

  @Column({ name: 'titulo', type: 'text' })
  titulo!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ name: 'imagen', type: 'text', nullable: true })
  imagen!: string | null;

  @Column({ name: 'link_validacion', type: 'text', nullable: true })
  link_validacion!: string | null;
}
