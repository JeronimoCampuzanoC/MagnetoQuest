import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppUser } from '../entities/AppUser';
import { Resume } from '../entities/Resume';
import { Project } from '../entities/Project';
import { Certificate } from '../entities/Certificate';
import { Badge } from '../entities/Badge';
import { BadgeProgress } from '../entities/BadgeProgress';
import { Mission } from '../entities/Mission';
import { UserMissionProgress } from '../entities/UserMissionProgress';
import { TriviaQuestion } from '../entities/TriviaQuestion';
import { TriviaAttempt } from '../entities/TriviaAttempt';
import { NotificationLog } from '../entities/NotificationLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5433), // ← CORREGIDO: puerto 5433 para test
  username: process.env.DB_USER ?? 'poc_user',
  password: process.env.DB_PASS ?? 'poc_pass',
  database: process.env.DB_NAME ?? 'poc_db',
  synchronize: false,
  logging: true,
  migrationsRun: true,
  entities: [
    AppUser, Resume, Project, Certificate,
    Badge, BadgeProgress,
    Mission, UserMissionProgress,
    TriviaQuestion, TriviaAttempt,
    NotificationLog,
  ],
});