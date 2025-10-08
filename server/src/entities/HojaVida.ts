import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity({ name: 'hoja_vida' })
export class HojaVida {
  @PrimaryGeneratedColumn('uuid', { name: 'id_hoja_vida' })
  id_hoja_vida!: string;

  @Index()
  @Column({ name: 'id_usuario', type: 'uuid' })
  id_usuario!: string;

  @ManyToOne(() => Usuario, (u) => u.hojas_vida, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario!: Usuario;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ name: 'experiencia', type: 'text', nullable: true })
  experiencia!: string | null;

  @Column({ name: 'cursos', type: 'text', nullable: true })
  cursos!: string | null;

  @Column({ name: 'proyectos', type: 'text', nullable: true })
  proyectos!: string | null;

  @Column({ name: 'idiomas', type: 'text', nullable: true })
  idiomas!: string | null;

  @Column({ name: 'referencias', type: 'text', nullable: true })
  referencias!: string | null;
}