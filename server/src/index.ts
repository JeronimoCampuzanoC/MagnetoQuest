import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './db/data-source';
import { AppUser } from './entities/AppUser';
import { Project } from './entities/Project';
import triviaProxyRoutes from './routes/trivia-proxy.routes';
import { Certificate } from './entities/Certificate';
import { Mission } from './entities/Mission';
import { Badge } from './entities/Badge';
import { BadgeProgress } from './entities/BadgeProgress';
import { NotificationLog } from './entities/NotificationLog';
import { Resume } from './entities/Resume';
import { TriviaAttempt } from './entities/TriviaAttempt';
import { TriviaQuestion } from './entities/TriviaQuestion';
import { UserMissionProgress } from './entities/UserMissionProgress';
import { UserProgress } from './entities/UserProgress';
import { NotificationService } from './services/NotificationService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.get('/api/hello', async (_req, res)=>{
  res.json({message:"Hola desde el back"})
  console.log("Mensaje enviado");
});

// Endpoints para testing de notificaciones (solo para desarrollo)
app.post('/api/test/notifications/morning', async (_req, res) => {
  try {
    const notificationService = new NotificationService();
    await notificationService.testMorningNotifications();
    res.json({ message: 'Morning notifications test completed' });
  } catch (error) {
    console.error('Error testing morning notifications:', error);
    res.status(500).json({ error: 'Failed to test morning notifications' });
  }
});

app.post('/api/test/notifications/evening', async (_req, res) => {
  try {
    const notificationService = new NotificationService();
    await notificationService.testEveningNotifications();
    res.json({ message: 'Evening notifications test completed' });
  } catch (error) {
    console.error('Error testing evening notifications:', error);
    res.status(500).json({ error: 'Failed to test evening notifications' });
  }
});

// Endpoints para gestionar user_progress
app.get('/api/users/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    let userProgress = await userProgressRepo.findOne({
      where: { user_id: userId }
    });

    // Si no existe, crear uno nuevo con valores por defecto
    if (!userProgress) {
      userProgress = userProgressRepo.create({
        user_id: userId,
        streak: 0,
        has_done_today: false,
        magento_points: 0
      });
      await userProgressRepo.save(userProgress);
    }

    res.json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

app.put('/api/users/:userId/progress/trivia-completed', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    let userProgress = await userProgressRepo.findOne({
      where: { user_id: userId }
    });

    if (!userProgress) {
      userProgress = userProgressRepo.create({
        user_id: userId,
        streak: 1,
        has_done_today: true,
        magento_points: 10 // Puntos por completar trivia
      });
    } else {
      // Si ya completó hoy, no incrementar racha
      if (!userProgress.has_done_today) {
        userProgress.streak += 1;
        userProgress.has_done_today = true;
        userProgress.magento_points += 10;
      }
    }
    
    userProgress.updated_at = new Date();
    await userProgressRepo.save(userProgress);

    res.json(userProgress);
  } catch (error) {
    console.error('Error updating user progress:', error);
    res.status(500).json({ error: 'Failed to update user progress' });
  }
});

// Endpoint para resetear el has_done_today a false (se ejecutaría diariamente)
app.post('/api/admin/reset-daily-progress', async (req, res) => {
  try {
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    await userProgressRepo.update(
      {}, // Actualizar todos los registros
      { has_done_today: false }
    );

    res.json({ message: 'Daily progress reset completed' });
  } catch (error) {
    console.error('Error resetting daily progress:', error);
    res.status(500).json({ error: 'Failed to reset daily progress' });
  }
});


// LISTAR misiones
app.get('/users/:userId/missions-in-progress', async (req, res) => {
  const { userId } = req.params;
  console.log('Listando misiones en progreso para userId=', userId);
  const qb = AppDataSource.getRepository(UserMissionProgress)
    .createQueryBuilder('ump')
    .innerJoin('ump.mission', 'm')
    .select([
      'm.mission_id AS id',
      'm.title       AS text',
      "CASE WHEN ump.status = 'in_progress' THEN TRUE ELSE FALSE END AS active",
    ])
    .where('ump.user_id = :userId', { userId })
    .orderBy('m.created_at', 'DESC');

  const result = await qb.getRawMany(); // ya sale con { id, text, active }
  res.json(result);
});


// LISTAR insignias
app.get('/users/:userId/badges', async (req, res) => {
  const { userId } = req.params;
  console.log('Listando insignias para userId=', userId);
  try {
    // Badge no tiene relación directa a AppUser; la relación viene a través de badge_progress
    const qb = AppDataSource.getRepository(BadgeProgress)
      .createQueryBuilder('bp')
      .innerJoin('bp.badge', 'b')
      .select([
        'b.badge_name AS badge_name',
        'b.badge_score AS badge_score',
      ])
      .where('bp.user_id = :userId', { userId })
      .orderBy('b.badge_name', 'ASC');

    const result = await qb.getRawMany();
    res.json(result);
  } catch (err) {
    console.error('Error listing badges for user', userId, err);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR usuarios
app.get('/api/appusers', async (_req, res) => {
  try {
    const repo = AppDataSource.getRepository(AppUser);
    const users = await repo.find({ order: { id_app_user: 'ASC' } });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    const repo = AppDataSource.getRepository(AppUser);
    const user = repo.create({ name: name.trim() });
    await repo.save(user);
    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR proyecto
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, projectDate, url, userId } = req.body ?? {};
    
    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    // For now, we'll use a default user ID if not provided
    // In a real app, you'd get this from authentication
    const defaultUserId = 'b512eddd-524b-4ec1-8564-f3c7331fe912';
    const projectUserId = userId || defaultUserId;
    
    const repo = AppDataSource.getRepository(Project);
    const project = repo.create({
      title: name.trim(),
      description: description?.trim() || '',
      url: url?.trim() || null,
      user_id: projectUserId
    });
    
    if (projectDate) {
      project.project_date = new Date(projectDate);
    }
    
    await repo.save(project);
    res.status(201).json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR proyectos
app.get('/api/projects', async (req, res) => {
  try {
    const { userId } = req.query;
    const repo = AppDataSource.getRepository(Project);
    
    let projects;
    if (userId) {
      projects = await repo.find({ 
        where: { user_id: userId as string },
        order: { project_id: 'ASC' }
      });
    } else {
      projects = await repo.find({ order: { project_id: 'ASC' } });
    }
    
    res.json(projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ACTUALIZAR proyecto
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, projectDate, url } = req.body ?? {};
    
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { project_id: id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    project.title = name.trim();
    project.description = description?.trim() || '';
    project.url = url?.trim() || null;
    
    if (projectDate) {
      project.project_date = new Date(projectDate);
    }
    
    await repo.save(project);
    res.json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ELIMINAR proyecto
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Project);
    
    const project = await repo.findOne({ where: { project_id: id } });
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    await repo.remove(project);
    res.json({ message: 'Proyecto eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 👇 AUTHENTICATION ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body ?? {};
    
    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const repo = AppDataSource.getRepository(AppUser);
    
    // Search for user by name (case insensitive)
    const user = await repo.findOne({
      where: { name: username.trim() }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (excluding sensitive information if any)
    const userData = {
      id: user.id_app_user,
      username: user.name,
      name: user.name,
      email: user.email,
      sector: user.sector,
      target_position: user.target_position,
      city: user.city
    };

    res.json({ user: userData });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREAR certificado
app.post('/api/certificates', async (req, res) => {
  try {
    const { name, description, userId } = req.body ?? {};
    
    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }
    
    const repo = AppDataSource.getRepository(Certificate);
    const certificate = repo.create({
      title: name.trim(),
      description: description?.trim() || '',
      user_id: userId
    });
    
    await repo.save(certificate);
    res.status(201).json(certificate);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR certificados
app.get('/api/certificates', async (req, res) => {
  try {
    const { userId } = req.query;
    const repo = AppDataSource.getRepository(Certificate);
    
    let certificates;
    if (userId) {
      certificates = await repo.find({ 
        where: { user_id: userId as string },
        order: { certificate_id: 'ASC' }
      });
    } else {
      certificates = await repo.find({ order: { certificate_id: 'ASC' } });
    }
    
    res.json(certificates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ACTUALIZAR certificado
app.put('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body ?? {};
    
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    const repo = AppDataSource.getRepository(Certificate);
    const certificate = await repo.findOne({ where: { certificate_id: id } });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }
    
    certificate.title = name.trim();
    certificate.description = description?.trim() || '';
    
    await repo.save(certificate);
    res.json(certificate);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ELIMINAR certificado
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(Certificate);
    
    const certificate = await repo.findOne({ where: { certificate_id: id } });
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }
    
    await repo.remove(certificate);
    res.json({ message: 'Certificado eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// 👇 NUEVA RUTA PROXY PARA TRIVIA
app.use('/api/trivia', triviaProxyRoutes);


const PORT = process.env.PORT || 4000;

// Inicializa TypeORM y arranca el server
interface TypeORMInitSuccess {
  (): void;
}

interface TypeORMInitError {
  (err: unknown): void;
}

AppDataSource.initialize()
  .then(((): void => {
    console.log('✅ TypeORM conectado');
    
    // Inicializar el servicio de notificaciones
    const notificationService = new NotificationService();
    notificationService.initializeCronJobs();
    
    app.listen(PORT, (): void => console.log(`API http://localhost:${PORT}`));
  }) as TypeORMInitSuccess)
  .catch(((err: unknown): void => {
    console.error('❌ Error al conectar TypeORM', err);
    process.exit(1);
  }) as TypeORMInitError);