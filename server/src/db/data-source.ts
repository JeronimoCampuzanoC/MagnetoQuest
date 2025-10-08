import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { HojaVida } from '../entities/HojaVida';
import { Proyecto } from '../entities/Proyecto';
import { Certificado } from '../entities/Certificado';
import { Insignia } from '../entities/Insignia';
import { ProgresoInsignia } from '../entities/ProgresoInsignia';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'poc_user',
  password: process.env.DB_PASS ?? 'poc_pass', // ← aseguramos string
  database: process.env.DB_NAME ?? 'poc_db',
  entities:  [Usuario, HojaVida, Proyecto, Certificado, Insignia, ProgresoInsignia],
  synchronize: true,
  logging: false,
});