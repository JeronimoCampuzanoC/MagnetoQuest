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
import { UserMissionProgress } from './entities/UserMissionProgress';
import { UserProgress } from './entities/UserProgress';
import { NotificationService } from './services/NotificationService';
import { dailyResetService } from './services/DailyResetService';

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

app.post('/api/test/notifications/mission-deadline', async (_req, res) => {
  try {
    const notificationService = new NotificationService();
    await notificationService.testMissionDeadlineNotifications();
    res.json({ message: 'Mission deadline notifications test completed' });
  } catch (error) {
    console.error('Error testing mission deadline notifications:', error);
    res.status(500).json({ error: 'Failed to test mission deadline notifications' });
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

// ======================================
// ENDPOINTS DE ADMINISTRACIÓN DEL RESET DIARIO
// ======================================

// Endpoint para ejecutar el reset diario manualmente (útil para testing/debugging)
app.post('/api/admin/daily-reset/execute', async (_req, res) => {
  try {
    await dailyResetService.performDailyReset();
    res.json({ 
      message: 'Reset diario ejecutado correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ejecutando reset diario manual:', error);
    res.status(500).json({ error: 'Error al ejecutar el reset diario' });
  }
});

// Endpoint para obtener el estado del servicio de reset diario
app.get('/api/admin/daily-reset/status', (_req, res) => {
  try {
    const status = dailyResetService.getStatus();
    res.json({
      ...status,
      serverTime: new Date().toISOString(),
      timezone: 'America/Bogota'
    });
  } catch (error) {
    console.error('Error obteniendo estado del servicio:', error);
    res.status(500).json({ error: 'Error al obtener el estado' });
  }
});

// Endpoint para resetear el has_done_today a false (DEPRECATED - usar /api/admin/daily-reset/execute)
app.post('/api/admin/reset-daily-progress', async (_req, res) => {
  try {
    console.log('⚠️  [DEPRECATED] Este endpoint está deprecado. Usa /api/admin/daily-reset/execute en su lugar');
    
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    await userProgressRepo.update(
      {}, // Actualizar todos los registros
      { has_done_today: false }
    );

    res.json({ 
      message: 'Daily progress reset completed (DEPRECATED - usa /api/admin/daily-reset/execute)',
      warning: 'Este endpoint está deprecado y será removido en futuras versiones'
    });
  } catch (error) {
    console.error('Error resetting daily progress:', error);
    res.status(500).json({ error: 'Failed to reset daily progress' });
  }
});

// OBTENER notificaciones de un usuario
app.get('/api/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const notificationRepo = AppDataSource.getRepository(NotificationLog);
    
    const notifications = await notificationRepo.find({
      where: { user_id: userId },
      order: { sent_at: 'DESC' },
      take: Number(limit),
      skip: Number(offset)
    });

    // Formatear las notificaciones para el frontend
    const formattedNotifications = notifications.map(notification => {
      let title = '';
      let message = '';
      let type = 'info';
      
      // Determinar título y mensaje basado en el template
      switch (notification.template) {
        case 'motivational_reminder':
          title = '📧 Recordatorio enviado';
          message = 'Te enviamos un recordatorio por email para mantener tu racha activa';
          type = 'trivia';
          break;
        case 'mission_deadline_reminder':  
          const missionTitle = notification.metadata?.mission_title || 'Tu misión';
          const hoursRemaining = notification.metadata?.hours_remaining || 0;
          const progress = notification.metadata?.progress || 0;
          const urgencyLevel = notification.metadata?.urgency_level || 'reminder';
          
          let urgencyEmoji = '⏰';
          if (urgencyLevel === 'urgent') urgencyEmoji = '🚨';
          else if (urgencyLevel === 'warning') urgencyEmoji = '⚠️';
          
          title = `${urgencyEmoji} ${missionTitle}`;
          
          let timeText = '';
          if (hoursRemaining < 1) {
            timeText = `${Math.floor(hoursRemaining * 60)} minutos`;
          } else if (hoursRemaining < 24) {
            timeText = `${Math.floor(hoursRemaining)} horas`;
          } else {
            const days = Math.floor(hoursRemaining / 24);
            timeText = `${days} día${days > 1 ? 's' : ''}`;
          }
          
          message = `Tu misión "${missionTitle}" vence en ${timeText}. Progreso: ${progress}%`;
          type = 'mission';
          break;
        case 'welcome':
          title = '🎉 ¡Bienvenido a MagnetoQuest!';
          message = 'Te damos la bienvenida a nuestra plataforma';
          type = 'welcome';
          break;
        case 'mission_remind':
          title = '📋 Recordatorio de misión';
          message = 'No olvides completar tus misiones pendientes';
          type = 'mission';
          break;
        case 'badge_award':
          title = '🏆 ¡Nueva insignia!';
          message = 'Has ganado una nueva insignia por tu progreso';
          type = 'achievement';
          break;
        case 'trivia_week':
          title = '🧠 Resumen semanal de trivia';
          message = 'Revisa tu progreso semanal en las trivias';
          type = 'trivia';
          break;
        default:
          title = '🔔 Notificación';
          message = 'Tienes una nueva notificación';
          type = 'info';
      }

      return {
        id: notification.notification_id,
        title,
        message,
        type,
        channel: notification.channel,
        timestamp: notification.sent_at,
        metadata: notification.metadata
      };
    });

    res.json({
      notifications: formattedNotifications,
      total: formattedNotifications.length,
      hasMore: formattedNotifications.length === Number(limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// MARCAR notificación como leída (para futuras implementaciones)
app.put('/api/users/:userId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    
    // Por ahora solo devolvemos success, pero en el futuro podríamos
    // agregar un campo "read_at" a la tabla notification_log
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
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

    // 🎯 ACTUALIZAR PROGRESO DE MISIONES DE TIPO PROJECT
    try {
      const missionProgressRepo = AppDataSource.getRepository(UserMissionProgress);
      const missionRepo = AppDataSource.getRepository(Mission);

      // Buscar todas las misiones activas de tipo Project
      const projectMissions = await missionRepo
        .createQueryBuilder('m')
        .where('m.category = :category', { category: 'Project' })
        .andWhere('m.is_active = :active', { active: true })
        .getMany();

      console.log(`📂 [Projects] Encontradas ${projectMissions.length} misiones de tipo Project activas`);

      // Para cada misión de Project, actualizar el progreso del usuario
      for (const mission of projectMissions) {
        // Buscar o crear el progreso de esta misión para el usuario
        let missionProgress = await missionProgressRepo.findOne({
          where: {
            user_id: projectUserId,
            mission_id: mission.mission_id
          }
        });

        if (!missionProgress) {
          // Si no existe, crear el progreso inicial
          missionProgress = missionProgressRepo.create({
            user_id: projectUserId,
            mission_id: mission.mission_id,
            status: 'in_progress',
            progress: 0,
            starts_at: new Date(),
            ends_at: null
          });
          console.log(`✨ [Projects] Creando progreso inicial para misión "${mission.title}"`);
        }

        // Incrementar el progreso solo si no está completada
        if (missionProgress.status !== 'completed') {
          missionProgress.progress += 1;
          console.log(`➕ [Projects] Progreso de misión "${mission.title}": ${missionProgress.progress}/${mission.objective}`);

          // Verificar si la misión se completó
          if (missionProgress.progress >= mission.objective) {
            missionProgress.status = 'completed';
            missionProgress.completed_at = new Date();
            console.log(`🏆 [Projects] ¡Misión "${mission.title}" completada!`);

            // 🎁 Otorgar recompensa de XP (magento_points)
            try {
              const userProgressRepo = AppDataSource.getRepository(UserProgress);
              let userProgress = await userProgressRepo.findOne({
                where: { user_id: projectUserId }
              });

              if (userProgress) {
                userProgress.magento_points += mission.xp_reward;
                userProgress.updated_at = new Date();
                await userProgressRepo.save(userProgress);
                console.log(`💰 [Projects] +${mission.xp_reward} puntos otorgados. Total: ${userProgress.magento_points}`);
              }
            } catch (xpError) {
              console.error('❌ [Projects] Error al otorgar XP:', xpError);
            }
          } else {
            // Si no está completada, asegurar que el estado sea in_progress
            if (missionProgress.status === 'not_started') {
              missionProgress.status = 'in_progress';
              missionProgress.starts_at = new Date();
            }
          }

          await missionProgressRepo.save(missionProgress);
        }
      }

      console.log(`✅ [Projects] Progreso de misiones actualizado para usuario ${projectUserId}`);
    } catch (missionError) {
      console.error('❌ [Projects] Error al actualizar progreso de misiones:', missionError);
      // No fallar la petición principal si hay error en misiones
    }

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

    // 🎯 ACTUALIZAR PROGRESO DE MISIONES DE TIPO CERTIFICATE
    try {
      const missionProgressRepo = AppDataSource.getRepository(UserMissionProgress);
      const missionRepo = AppDataSource.getRepository(Mission);

      // Buscar todas las misiones activas de tipo Certificate
      const certificateMissions = await missionRepo
        .createQueryBuilder('m')
        .where('m.category = :category', { category: 'Certificate' })
        .andWhere('m.is_active = :active', { active: true })
        .getMany();

      console.log(`📋 [Certificates] Encontradas ${certificateMissions.length} misiones de tipo Certificate activas`);

      // Para cada misión de Certificate, actualizar el progreso del usuario
      for (const mission of certificateMissions) {
        // Buscar o crear el progreso de esta misión para el usuario
        let missionProgress = await missionProgressRepo.findOne({
          where: {
            user_id: userId,
            mission_id: mission.mission_id
          }
        });

        if (!missionProgress) {
          // Si no existe, crear el progreso inicial
          missionProgress = missionProgressRepo.create({
            user_id: userId,
            mission_id: mission.mission_id,
            status: 'in_progress',
            progress: 0,
            starts_at: new Date(),
            ends_at: null
          });
          console.log(`✨ [Certificates] Creando progreso inicial para misión "${mission.title}"`);
        }

        // Incrementar el progreso solo si no está completada
        if (missionProgress.status !== 'completed') {
          missionProgress.progress += 1;
          console.log(`➕ [Certificates] Progreso de misión "${mission.title}": ${missionProgress.progress}/${mission.objective}`);

          // Verificar si la misión se completó
          if (missionProgress.progress >= mission.objective) {
            missionProgress.status = 'completed';
            missionProgress.completed_at = new Date();
            console.log(`🏆 [Certificates] ¡Misión "${mission.title}" completada!`);

            // 🎁 Otorgar recompensa de XP (magento_points)
            try {
              const userProgressRepo = AppDataSource.getRepository(UserProgress);
              let userProgress = await userProgressRepo.findOne({
                where: { user_id: userId }
              });

              if (userProgress) {
                userProgress.magento_points += mission.xp_reward;
                userProgress.updated_at = new Date();
                await userProgressRepo.save(userProgress);
                console.log(`💰 [Certificates] +${mission.xp_reward} puntos otorgados. Total: ${userProgress.magento_points}`);
              }
            } catch (xpError) {
              console.error('❌ [Certificates] Error al otorgar XP:', xpError);
            }
          } else {
            // Si no está completada, asegurar que el estado sea in_progress
            if (missionProgress.status === 'not_started') {
              missionProgress.status = 'in_progress';
              missionProgress.starts_at = new Date();
            }
          }

          await missionProgressRepo.save(missionProgress);
        }
      }

      console.log(`✅ [Certificates] Progreso de misiones actualizado para usuario ${userId}`);
    } catch (missionError) {
      console.error('❌ [Certificates] Error al actualizar progreso de misiones:', missionError);
      // No fallar la petición principal si hay error en misiones
    }

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

// GUARDAR INTENTO DE TRIVIA
app.post('/api/trivia-attempts', async (req, res) => {
  try {
    const { user_id, category, difficulty, score, total_time, precision_score } = req.body;

    // Validar campos requeridos
    if (!user_id || !category || !difficulty || score == null || total_time == null || precision_score == null) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const repo = AppDataSource.getRepository(TriviaAttempt);
    const attempt = repo.create({
      user_id,
      category,
      difficulty,
      score,
      total_time,
      precision_score
    });

    await repo.save(attempt);

    // 🎯 ACTUALIZAR PROGRESO DE BADGES DE TIPO TRIVIA
    try {
      const badgeProgressRepo = AppDataSource.getRepository(BadgeProgress);
      
      // Buscar todos los badge_progress del usuario que tengan badge con category = 'Trivia'
      // y donde el progress actual sea menor que el quantity del badge
      const triviaBadgeProgresses = await badgeProgressRepo
        .createQueryBuilder('bp')
        .innerJoinAndSelect('bp.badge', 'badge')
        .where('bp.user_id = :userId', { userId: user_id })
        .andWhere('badge.category = :category', { category: 'Trivia' })
        .andWhere('bp.progress < badge.quantity')
        .andWhere('bp.awarded_at IS NULL') // Solo badges no completados
        .getMany();

      console.log(`📊 Encontrados ${triviaBadgeProgresses.length} badges de Trivia para actualizar`);

      // Incrementar el progress de cada badge encontrado
      for (const badgeProgress of triviaBadgeProgresses) {
        badgeProgress.progress += 1;
        
        // Si alcanzó la cantidad requerida, marcar como completado
        if (badgeProgress.progress >= badgeProgress.badge.quantity!) {
          badgeProgress.awarded_at = new Date();
          console.log(`🏆 Badge "${badgeProgress.badge.badge_name}" completado para usuario ${user_id}`);
        }
        
        await badgeProgressRepo.save(badgeProgress);
        console.log(`✅ Progress actualizado para badge "${badgeProgress.badge.badge_name}": ${badgeProgress.progress}/${badgeProgress.badge.quantity}`);
      }
    } catch (badgeError) {
      console.error('❌ Error al actualizar progreso de badges:', badgeError);
      // No fallar la petición principal si hay error en badges
    }

    res.status(201).json(attempt);
  } catch (e) {
    console.error('Error al guardar intento de trivia:', e);
    res.status(500).json({ error: 'Error al guardar en la base de datos' });
  }
});

// OBTENER ESTADÍSTICAS DE TRIVIA POR USUARIO
app.get('/api/trivia-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const repo = AppDataSource.getRepository(TriviaAttempt);

    // Obtener promedios
    const averagesQuery = await repo
      .createQueryBuilder('attempt')
      .select([
        'AVG(attempt.score)::float as average_score',
        'AVG(attempt.precision_score)::float as average_precision',
        'AVG(attempt.total_time)::float as average_time'
      ])
      .where('attempt.user_id = :userId', { userId })
      .getRawOne();

    // Obtener conteo por dificultad usando SQL directo para mayor control
    const difficultyCountsQuery = await AppDataSource.manager.query(`
      WITH difficulties(difficulty) AS (
        VALUES ('easy'::difficulty), ('medium'::difficulty), ('hard'::difficulty)
      )
      SELECT 
        d.difficulty,
        COALESCE(COUNT(ta.attempt_id), 0)::integer as count
      FROM difficulties d
      LEFT JOIN trivia_attempt ta ON 
        ta.difficulty = d.difficulty AND 
        ta.user_id = $1
      GROUP BY d.difficulty
      ORDER BY d.difficulty;
    `, [userId]);

    // Procesar conteos por dificultad en un objeto
    const difficultyCounts: { [key in 'easy' | 'medium' | 'hard']: number } = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    difficultyCountsQuery.forEach((item: { difficulty: string, count: string }) => {
      const difficulty = item.difficulty as 'easy' | 'medium' | 'hard';
      // Convertir a número de forma segura
      difficultyCounts[difficulty] = parseInt(item.count) || 0;
    });

    // Combinar resultados
    const stats = {
      averages: {
        score: parseFloat(averagesQuery.average_score || '0'),
        precision: parseFloat(averagesQuery.average_precision || '0'),
        time: parseFloat(averagesQuery.average_time || '0')
      },
      attemptsByDifficulty: difficultyCounts
    };

    res.json(stats);
  } catch (e) {
    console.error('Error al obtener estadísticas de trivia:', e);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

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
    
    // 🔄 Iniciar el servicio de reset diario
    dailyResetService.start();
    
    app.listen(PORT, (): void => console.log(`API http://localhost:${PORT}`));
  }) as TypeORMInitSuccess)
  .catch(((err: unknown): void => {
    console.error('❌ Error al conectar TypeORM', err);
    process.exit(1);
  }) as TypeORMInitError);