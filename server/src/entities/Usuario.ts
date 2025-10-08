import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HojaVida } from './HojaVida';
import { Proyecto } from './Proyecto';
import { Certificado } from './Certificado';
import { ProgresoInsignia } from './ProgresoInsignia';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id_usuario!: string;

  @Column({ name: 'nombre', type: 'text' })
  nombre!: string;

  @Column({ name: 'sector', type: 'text', nullable: true })
  sector!: string | null;

  @Column({ name: 'cargo_objetivo', type: 'text', nullable: true })
  cargo_objetivo!: string | null;

  @Column({
    name: 'salario_minimo',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v?: string | number | null) => v,
      from: (v: string | null) => (v === null ? null : v), // devuelve string
    },
  })
  salario_minimo!: string | null;

  @Column({ name: 'nivel_estudios', type: 'text', nullable: true })
  nivel_estudios!: string | null;

  @Column({ name: 'disponible_para', type: 'text', nullable: true })
  disponible_para!: string | null;

  @Column({ name: 'ciudad', type: 'text', nullable: true })
  ciudad!: string | null;

  @OneToMany(() => HojaVida, (hv) => hv.usuario)
  hojas_vida!: HojaVida[];

  @OneToMany(() => Proyecto, (p) => p.usuario)
  proyectos!: Proyecto[];

  @OneToMany(() => Certificado, (c) => c.usuario)
  certificados!: Certificado[];

  @OneToMany(() => ProgresoInsignia, (p) => p.usuario)
  progresos!: ProgresoInsignia[];
}
