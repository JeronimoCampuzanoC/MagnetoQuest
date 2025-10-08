import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  // Unique,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Insignia } from './Insignia';

@Entity({ name: 'progreso_insignia' })
// Si quieres evitar duplicados por (usuario, insignia) descomenta:
// @Unique('uq_usuario_insignia', ['id_usuario', 'id_insignia'])
export class ProgresoInsignia {
  @PrimaryGeneratedColumn('uuid', { name: 'id_progreso' })
  id_progreso!: string;

  @Index()
  @Column({ name: 'id_usuario', type: 'uuid' })
  id_usuario!: string;

  @ManyToOne(() => Usuario, (u) => u.progresos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario!: Usuario;

  @Index()
  @Column({ name: 'id_insignia', type: 'uuid' })
  id_insignia!: string;

  @ManyToOne(() => Insignia, (i) => i.progresos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_insignia', referencedColumnName: 'id_insignia' })
  insignia!: Insignia;

  @Column({ name: 'progreso', type: 'int', default: 0 })
  progreso!: number;
}
