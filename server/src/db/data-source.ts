import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppUser } from '../entities/AppUser';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'poc_user',
  password: process.env.DB_PASS ?? 'poc_pass',
  database: process.env.DB_NAME ?? 'poc_db',
  entities: [AppUser],
  synchronize: false, // <- Change to false for production
  logging: true, // <- Enable logging to debug connection issues
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true, // <- Automatically run migrations
});