import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Usuario } from './Usuario';

@Entity({ name: 'proyecto' })
export class Proyecto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_proyecto' })
  id_proyecto!: string;

  @Index()
  @Column({ name: 'id_usuario', type: 'uuid' })
  id_usuario!: string;

  @ManyToOne(() => Usuario, (u) => u.proyectos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario!: Usuario;

  @Column({ name: 'titulo', type: 'text' })
  titulo!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ name: 'url', type: 'text', nullable: true })
  url!: string | null;

  @Column({ name: 'imagen_previsualizacion', type: 'text', nullable: true })
  imagen_previsualizacion!: string | null;

  @Column({ name: 'documento', type: 'text', nullable: true })
  documento!: string | null;
}
