import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProgresoInsignia } from './ProgresoInsignia';

@Entity({ name: 'insignia' })
export class Insignia {
  @PrimaryGeneratedColumn('uuid', { name: 'id_insignia' })
  id_insignia!: string;

  @Column({ name: 'nombre_insignia', type: 'text' })
  nombre_insignia!: string;

  @Column({ name: 'puntaje_insignia', type: 'int' })
  puntaje_insignia!: number;

  @Column({ name: 'categoria', type: 'text', nullable: true })
  categoria!: string | null;

  @Column({ name: 'parametro', type: 'text', nullable: true })
  parametro!: string | null;

  @Column({ name: 'cantidad', type: 'int', nullable: true })
  cantidad!: number | null;

  @OneToMany(() => ProgresoInsignia, (p) => p.insignia)
  progresos!: ProgresoInsignia[];
}
