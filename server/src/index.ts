import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './db/data-source';
import { AppUser } from './entities/AppUser';
import { Project } from './entities/Project';
import triviaProxyRoutes from './routes/trivia-proxy.routes';
import { Certificate } from './entities/Certificate';
import { Mission, MissionCategory } from './entities/Mission';
import { Badge } from './entities/Badge';
import { BadgeProgress } from './entities/BadgeProgress';
import { NotificationLog } from './entities/NotificationLog';
import { Resume } from './entities/Resume';
import { TriviaAttempt } from './entities/TriviaAttempt';
import { UserMissionProgress } from './entities/UserMissionProgress';
import { UserProgress } from './entities/UserProgress';
import { NotificationService } from './services/NotificationService';
import { dailyResetService } from './services/DailyResetService';
import { missionDelegateService } from './services/MissionDelegate';
import { In } from 'typeorm';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to create badge award notifications
async function createBadgeAwardNotification(userId: string, badgeName: string, badgeScore: number, category: string) {
  try {
    const notificationRepo = AppDataSource.getRepository(NotificationLog);
    const notification = notificationRepo.create({
      user_id: userId,
      channel: 'email',
      template: 'badge_award',
      metadata: {
        badge_name: badgeName,
        badge_score: badgeScore,
        category: category,
        awarded_at: new Date().toISOString()
      }
    });
    await notificationRepo.save(notification);
    console.log(`🔔 Notificación de badge creada: ${badgeName} para usuario ${userId}`);
  } catch (error) {
    console.error('❌ Error al crear notificación de badge:', error);
    // No fallar la operación principal si falla la notificación
  }
}

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

// Endpoints para gestionar el MissionDelegate (admin only - en producción agregar autenticación)
app.post('/api/admin/mission-rotation/execute', async (_req, res) => {
  try {
    console.log('🔧 [Admin] Ejecutando rotación de misiones manualmente...');
    await missionDelegateService.executeManually();
    res.json({ 
      message: 'Mission rotation executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en rotación manual de misiones:', error);
    res.status(500).json({ error: 'Failed to execute mission rotation' });
  }
});

app.get('/api/admin/mission-rotation/status', async (_req, res) => {
  try {
    const isRunning = missionDelegateService.isRunning();
    res.json({ 
      status: isRunning ? 'running' : 'stopped',
      service: 'MissionDelegate',
      schedule: '0 0 * * * (midnight Bogota time)'
    });
  } catch (error) {
    console.error('❌ Error al verificar estado de MissionDelegate:', error);
    res.status(500).json({ error: 'Failed to get service status' });
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

    // ======================================
    // ACTUALIZAR BADGES DE TIPO MagnetoPoints
    // ======================================
    try {
      // 1) Asegurar que existan las filas badge_progress para todos los badges de categoría 'MagnetoPoints'
      //    Insertar con progress 0 y awarded_at NULL si faltan
      await AppDataSource.query(
        `
        INSERT INTO badge_progress (user_id, badge_id, progress, awarded_at)
        SELECT $1, b.badge_id, 0, NULL
        FROM badge b
        WHERE b.category = 'MagnetoPoints' AND b.quantity IS NOT NULL
        ON CONFLICT (user_id, badge_id) DO NOTHING
        `,
        [userId]
      );

      // 2) Actualizar progress basado en magento_points
      //    - progress = LEAST(magento_points, b.quantity)
      //    - awarded_at = NOW() únicamente cuando se alcanza la cantidad y awarded_at IS NULL
      const magentoPoints = userProgress?.magento_points || 0;
      const updatedMpRows = await AppDataSource.query(
        `
        UPDATE badge_progress bp
        SET
          progress = LEAST($2::int, b.quantity),
          awarded_at = CASE
            WHEN bp.awarded_at IS NULL AND LEAST($2::int, b.quantity) >= b.quantity THEN NOW()
            ELSE bp.awarded_at
          END
        FROM badge b
        WHERE bp.badge_id = b.badge_id
          AND bp.user_id = $1
          AND b.category = 'MagnetoPoints'
          AND b.quantity IS NOT NULL
          AND bp.awarded_at IS NULL
  RETURNING bp.badge_id AS badge_id, bp.progress AS progress, bp.awarded_at AS awarded_at, b.badge_name AS badge_name, b.quantity AS quantity, b.badge_score AS badge_score
        `,
        [userId, magentoPoints]
      );

  console.log(`📦 Actualizados ${updatedMpRows.length} badge_progress(es) de MagnetoPoints para user ${userId}`);
  // Debug: inspect returned shape and badge_score
  console.log(updatedMpRows);
  try { console.log(updatedMpRows[0][0].badge_score); } catch (e) { console.log('updatedMpRows[0].badge_score ->', (e as any)?.message ?? e); }
      if (updatedMpRows && updatedMpRows.length) {
        const totalToAdd = updatedMpRows[0][0].badge_score
        if (totalToAdd > 0) {
          await AppDataSource.query(
            `UPDATE user_progress SET magento_points = magento_points + $2, updated_at = NOW() WHERE user_id = $1`,
            [userId, totalToAdd]
          );
          console.log(`💰 Añadidos ${totalToAdd} MagnetoPoints por badges MagnetoPoints al usuario ${userId}`);
        }

        for (const r of updatedMpRows[0]) {
          const name = r.badge_name || r.badge_id;
          const progress = r.progress;
          const qty = r.quantity;
          const awarded = r.awarded_at ? '🏆 awarded' : '';
          console.log(`✅ MagnetoPoints Badge "${name}" -> ${progress}/${qty} ${awarded}`);
          
          // 🔔 Crear notificación si el badge fue otorgado
          if (r.awarded_at) {
            await createBadgeAwardNotification(userId, r.badge_name, r.badge_score, 'MagnetoPoints');
          }
        }
      }
    } catch (mpErr) {
      console.error('❌ Error actualizando badges MagnetoPoints:', mpErr);
      // No romper la respuesta por errores en badges
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
    // Optional: allow client to send final trivia score to be added to magento_points
    const { score } = req.body ?? {};
    const scoreValue = typeof score === 'number' ? score : (score ? parseInt(score, 10) || 0 : 0);
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    let userProgress = await userProgressRepo.findOne({
      where: { user_id: userId }
    });

    if (!userProgress) {
      userProgress = userProgressRepo.create({
        user_id: userId,
        streak: 1,
        has_done_today: false,
        // Puntos por completar trivia + score opcional enviado por el cliente
        magento_points: 10 + (scoreValue > 0 ? scoreValue : 0)
      });
    } else {
      // Si ya completó hoy, no incrementar racha
      if (!userProgress.has_done_today) {
        userProgress.streak += 1;
        userProgress.has_done_today = false;
        userProgress.magento_points += 10;
      }

      // Siempre sumar el score final de la trivia si se pasó en el body
      if (scoreValue > 0) {
        userProgress.magento_points += scoreValue;
      }
    }
    
    userProgress.updated_at = new Date();
    await userProgressRepo.save(userProgress);

    // 🎯 ACTUALIZAR PROGRESO DE MISIONES DE TIPO TRIVIA
    try {
      const missionRepo = AppDataSource.getRepository(Mission);
      const userMissionRepo = AppDataSource.getRepository(UserMissionProgress);
      
      // Buscar misiones activas de tipo Trivia
      const triviaMissions = await missionRepo.find({
        where: {
          category: MissionCategory.TRIVIA,
          is_active: true
        }
      });

      console.log(`📋 [Trivia] Encontradas ${triviaMissions.length} misiones de tipo Trivia activas`);

      for (const mission of triviaMissions) {
        // Buscar el progreso del usuario para esta misión
        let missionProgress = await userMissionRepo.findOne({
          where: {
            user_id: userId,
            mission_id: mission.mission_id,
            status: In(['not_started', 'in_progress'])
          }
        });

        if (missionProgress) {
          console.log(`🎯 [Trivia] Actualizando misión: "${mission.title}" para usuario ${userId}`);

          // Incrementar el progreso solo si no está completada
          if (missionProgress.status !== 'completed') {
            missionProgress.progress += 1;
            console.log(`➕ [Trivia] Progreso de misión "${mission.title}": ${missionProgress.progress}/${mission.objective}`);

            // Verificar si la misión se completó
            if (missionProgress.progress >= mission.objective) {
              missionProgress.status = 'completed';
              missionProgress.completed_at = new Date();
              console.log(`🏆 [Trivia] ¡Misión "${mission.title}" completada!`);

              // 🎁 Otorgar recompensa de XP (magento_points) de la misión
              try {
                // Recargar userProgress para tener la versión más reciente
                userProgress = await userProgressRepo.findOne({
                  where: { user_id: userId }
                });

                if (userProgress) {
                  userProgress.magento_points += mission.xp_reward;
                  userProgress.updated_at = new Date();
                  await userProgressRepo.save(userProgress);
                  console.log(`💰 [Trivia] +${mission.xp_reward} puntos de misión otorgados. Total: ${userProgress.magento_points}`);
                }
              } catch (xpError) {
                console.error('❌ [Trivia] Error al otorgar XP de misión:', xpError);
              }
            } else {
              // Si no está completada, asegurar que el estado sea in_progress
              if (missionProgress.status === 'not_started') {
                missionProgress.status = 'in_progress';
                missionProgress.starts_at = new Date();
              }
            }

            await userMissionRepo.save(missionProgress);
            console.log(`✅ [Trivia] Progreso de misión guardado`);
          }
        }
      }
    } catch (missionError) {
      console.error('⚠️ [Trivia] Error al actualizar progreso de misiones:', missionError);
      // No fallar la respuesta si hay error en las misiones
    }

    // ======================================
    // ACTUALIZAR BADGES DE TIPO STREAK
    // ======================================
    try {
      // asegurar que existan las filas badge_progress para badges de tipo 'Streak'
      await AppDataSource.query(
        `
        INSERT INTO badge_progress (user_id, badge_id, progress, awarded_at)
        SELECT $1, b.badge_id, 0, NULL
        FROM badge b
        WHERE b.category = 'Streak' AND b.quantity IS NOT NULL
        ON CONFLICT (user_id, badge_id) DO NOTHING
        `,
        [userId]
      );

      // actualizar progress basado en la racha actual del usuario
      // - progress = min(streak, b.quantity)
      // - awarded_at = NOW() solo si se alcanza o supera la cantidad y awarded_at IS NULL
      const streakValue = userProgress?.streak || 0;
      const updatedStreakRows = await AppDataSource.query(
        `
        UPDATE badge_progress bp
        SET
          progress = LEAST($2::int, b.quantity),
          awarded_at = CASE
            WHEN bp.awarded_at IS NULL AND LEAST($2::int, b.quantity) >= b.quantity THEN NOW()
            ELSE bp.awarded_at
          END
        FROM badge b
        WHERE bp.badge_id = b.badge_id
          AND bp.user_id = $1
          AND b.category = 'Streak'
          AND b.quantity IS NOT NULL
          AND bp.awarded_at IS NULL
  RETURNING bp.badge_id AS badge_id, bp.progress AS progress, bp.awarded_at AS awarded_at, b.badge_name AS badge_name, b.quantity AS quantity, b.badge_score AS badge_score
        `,
        [userId, streakValue]
      );

  console.log(`📈 Actualizados ${updatedStreakRows.length} badge_progress(es) de Streak para user ${userId}`);
  // Debug: inspect returned shape and badge_score
  console.log(updatedStreakRows);
  try { console.log(updatedStreakRows[0][0].badge_score); } catch (e) { console.log('updatedStreakRows[0].badge_score ->', (e as any)?.message ?? e); }
      if (updatedStreakRows && updatedStreakRows.length) {
        const totalToAdd = updatedStreakRows[0][0].badge_score;
        if (totalToAdd > 0) {
          await AppDataSource.query(
            `UPDATE user_progress SET magento_points = magento_points + $2, updated_at = NOW() WHERE user_id = $1`,
            [userId, totalToAdd]
          );
          console.log(`💰 Añadidos ${totalToAdd} MagnetoPoints por badges Streak al usuario ${userId}`);
        }

        for (const r of updatedStreakRows[0]) {
          const name = r.badge_name || r.badge_id;
          const progress = r.progress;
          const qty = r.quantity;
          const awarded = r.awarded_at ? '🏆 awarded' : '';
          console.log(`✅ Streak Badge "${name}" -> ${progress}/${qty} ${awarded}`);
          
          // 🔔 Crear notificación si el badge fue otorgado
          if (r.awarded_at) {
            await createBadgeAwardNotification(userId, r.badge_name, r.badge_score, 'Streak');
          }
        }
      }
    } catch (streakErr) {
      console.error('❌ Error actualizando badges Streak:', streakErr);
      // No fallar la petición principal si hay error en badges
    }

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
          const badgeName = notification.metadata?.badge_name || 'Insignia';
          const badgeScore = notification.metadata?.badge_score || 0;
          const badgeCategory = notification.metadata?.category || 'general';
          
          // Determinar emoji y texto según la categoría del badge
          let categoryEmoji = '🏆';
          let categoryText = '';
          
          switch (badgeCategory) {
            case 'Trivia':
              categoryEmoji = '🧠';
              categoryText = 'por completar trivias';
              break;
            case 'Streak':
              categoryEmoji = '🔥';
              categoryText = 'por mantener tu racha';
              break;
            case 'MagnetoPoints':
              categoryEmoji = '💎';
              categoryText = 'por acumular puntos';
              break;
            case 'CV':
              categoryEmoji = '📝';
              categoryText = 'por mejorar tu perfil';
              break;
            default:
              categoryText = 'por tu progreso';
          }
          
          title = `${categoryEmoji} ¡Nueva insignia desbloqueada!`;
          message = `Has ganado "${badgeName}" ${categoryText}. +${badgeScore} MagnetoPoints`;
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

// LISTAR MISIONES EN PROGRESO DE UN USUARIO
app.get('/users/:userId/missions-in-progress', async (req, res) => {
  const { userId } = req.params;
  console.log('Listando misiones para userId=', userId);
  try {
    const qb = AppDataSource.getRepository(UserMissionProgress)
      .createQueryBuilder('ump')
      .innerJoin('ump.mission', 'm')
      .select([
        'm.mission_id',
        'm.title',
        'm.description',
        'm.category',
        'ump.progress',
        'm.objective',
        'ump.ends_at',
        'ump.status',
      ])
      .where('ump.user_id = :userId', { userId });

    const result = await qb.getRawMany();

    const mapped = result.map(r => ({
      id: r.m_mission_id,
      title: r.m_title,
      description: r.m_description,
      category: r.m_category,
      progress: r.ump_progress,
      objective: r.m_objective,
      ends_at: r.ump_ends_at,
      active: r.ump_status === 'completed',  // ✅ true = completada
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error listing missions for user', userId, err);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR misiones de tipo Application para el usuario
app.get('/api/users/:userId/missions/applications', async (req, res) => {
  const { userId } = req.params;
  console.log('Listando misiones de Application para userId=', userId);
  try {
    const qb = AppDataSource.getRepository(UserMissionProgress)
      .createQueryBuilder('ump')
      .innerJoin('ump.mission', 'm')
      .select([
        'ump.ump_id',
        'ump.user_id',
        'ump.mission_id',
        'ump.status',
        'ump.progress',
        'ump.starts_at',
        'ump.ends_at',
        'ump.completed_at',
        'm.title',
        'm.description',
        'm.category',
        'm.xp_reward',
        'm.objective',
      ])
      .where('ump.user_id = :userId', { userId })
      .andWhere('m.category = :category', { category: 'Application' })
      .orderBy('ump.starts_at', 'DESC');

    const result = await qb.getRawMany();

    const mapped = result.map(r => ({
      ump_id: r.ump_ump_id,
      user_id: r.ump_user_id,
      mission_id: r.ump_mission_id,
      status: r.ump_status,
      progress: r.ump_progress,
      starts_at: r.ump_starts_at,
      ends_at: r.ump_ends_at,
      completed_at: r.ump_completed_at,
      mission_title: r.m_title,
      mission_description: r.m_description,
      mission_category: r.m_category,
      xp_reward: r.m_xp_reward,
      objective: r.m_objective,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error listing application missions for user', userId, err);
    res.status(500).json({ error: 'DB error' });
  }
});

// APLICAR a un empleo (incrementar progreso de misión de Application)
app.post('/api/users/:userId/missions/:missionId/apply', async (req, res) => {
  const { userId, missionId } = req.params;
  console.log(`📝 [Apply] Usuario ${userId} aplicando a misión ${missionId}`);
  
  try {
    const missionProgressRepo = AppDataSource.getRepository(UserMissionProgress);
    const missionRepo = AppDataSource.getRepository(Mission);
    const userProgressRepo = AppDataSource.getRepository(UserProgress);

    // Buscar el progreso de la misión del usuario
    const missionProgress = await missionProgressRepo.findOne({
      where: { user_id: userId, mission_id: missionId },
      relations: ['mission']
    });

    if (!missionProgress) {
      return res.status(404).json({ error: 'Misión no encontrada para este usuario' });
    }

    // Verificar que sea una misión de Application
    const mission = await missionRepo.findOne({ where: { mission_id: missionId } });
    if (!mission || mission.category !== 'Application') {
      return res.status(400).json({ error: 'Esta misión no es de tipo Application' });
    }

    // Verificar si ya está completada
    if (missionProgress.status === 'completed') {
      return res.status(400).json({ error: 'Esta misión ya está completada' });
    }

    // Incrementar el progreso
    const oldProgress = missionProgress.progress;
    missionProgress.progress += 1;

    // Verificar si se completó la misión
    if (missionProgress.progress >= mission.objective) {
      missionProgress.status = 'completed';
      missionProgress.completed_at = new Date();
      missionProgress.progress = mission.objective; // Asegurar que no exceda el objetivo

      // 🎯 Otorgar XP al usuario (MagnetoPoints)
      let userProgress = await userProgressRepo.findOne({ where: { user_id: userId } });
      
      if (!userProgress) {
        // Crear user_progress si no existe
        userProgress = userProgressRepo.create({
          user_id: userId,
          streak: 0,
          has_done_today: false,
          magento_points: 0
        });
      }

      userProgress.magento_points += mission.xp_reward;
      userProgress.updated_at = new Date();
      await userProgressRepo.save(userProgress);

      console.log(`✅ [Apply] Misión completada! Usuario ${userId} recibió ${mission.xp_reward} MagnetoPoints`);

      // Crear notificación de misión completada
      try {
        const notificationRepo = AppDataSource.getRepository(NotificationLog);
        const notification = notificationRepo.create({
          user_id: userId,
          channel: 'email',
          template: 'mission_completed',
          metadata: {
            mission_title: mission.title,
            mission_category: mission.category,
            xp_reward: mission.xp_reward,
            completed_at: new Date().toISOString()
          }
        });
        await notificationRepo.save(notification);
        console.log(`🔔 Notificación de misión completada creada para usuario ${userId}`);
      } catch (notifError) {
        console.error('❌ Error al crear notificación:', notifError);
      }

      // 🏆 Verificar y actualizar badges de MagnetoPoints
      try {
        await AppDataSource.query(
          `
          INSERT INTO badge_progress (user_id, badge_id, progress, awarded_at)
          SELECT $1, b.badge_id, 0, NULL
          FROM badge b
          WHERE b.category = 'MagnetoPoints' AND b.quantity IS NOT NULL
          ON CONFLICT (user_id, badge_id) DO NOTHING
          `,
          [userId]
        );

        await AppDataSource.query(
          `
          UPDATE badge_progress bp
          SET 
            progress = LEAST($2, b.quantity),
            awarded_at = CASE
              WHEN bp.awarded_at IS NULL AND $2 >= b.quantity THEN NOW()
              ELSE bp.awarded_at
            END
          FROM badge b
          WHERE bp.badge_id = b.badge_id
            AND bp.user_id = $1
            AND b.category = 'MagnetoPoints'
            AND b.quantity IS NOT NULL
          `,
          [userId, userProgress.magento_points]
        );

        // Verificar si se otorgó un nuevo badge
        const newBadgesResult = await AppDataSource.query(
          `
          SELECT b.badge_name, b.badge_score, b.category
          FROM badge_progress bp
          JOIN badge b ON bp.badge_id = b.badge_id
          WHERE bp.user_id = $1
            AND b.category = 'MagnetoPoints'
            AND bp.awarded_at >= NOW() - INTERVAL '5 seconds'
          `,
          [userId]
        );

        // Crear notificación para cada nuevo badge
        for (const badge of newBadgesResult) {
          const notificationRepo = AppDataSource.getRepository(NotificationLog);
          const badgeNotification = notificationRepo.create({
            user_id: userId,
            channel: 'email',
            template: 'badge_award',
            metadata: {
              badge_name: badge.badge_name,
              badge_score: badge.badge_score,
              category: badge.category,
              awarded_at: new Date().toISOString()
            }
          });
          await notificationRepo.save(badgeNotification);
          console.log(`🔔 Notificación de badge creada: ${badge.badge_name} para usuario ${userId}`);
        }

      } catch (badgeError) {
        console.error('❌ Error al actualizar badges:', badgeError);
      }
    } else {
      // Solo actualizar el estado a in_progress si aún no lo está
      if (missionProgress.status === 'not_started') {
        missionProgress.status = 'in_progress';
        missionProgress.starts_at = new Date();
      }
      console.log(`📈 [Apply] Progreso actualizado: ${oldProgress} → ${missionProgress.progress}/${mission.objective}`);
    }

    await missionProgressRepo.save(missionProgress);

    res.json({
      success: true,
      progress: missionProgress.progress,
      objective: mission.objective,
      status: missionProgress.status,
      completed: missionProgress.status === 'completed',
      xp_earned: missionProgress.status === 'completed' ? mission.xp_reward : 0,
      message: missionProgress.status === 'completed' 
        ? `¡Felicidades! Has completado la misión y ganado ${mission.xp_reward} MagnetoPoints` 
        : `Progreso: ${missionProgress.progress}/${mission.objective}`
    });

  } catch (err) {
    console.error('❌ [Apply] Error al aplicar a empleo:', err);
    res.status(500).json({ error: 'Error al procesar la aplicación' });
  }
});


// LISTAR insignias
app.get('/users/:userId/badges', async (req, res) => {
  const { userId } = req.params;
  console.log('Listando insignias para userId=', userId);
try {
    const qb = AppDataSource.getRepository(BadgeProgress)
      .createQueryBuilder('bp')
      .innerJoin('bp.badge', 'b')
      .select([
        'b.badge_name AS badge_name',
        'b.badge_score AS badge_score',
        'b.category AS category',
        'bp.progress AS progress',
        'bp.awarded_at AS awarded_at'
      ])
      .where('bp.user_id = :userId', { userId })
      // Mostrar sólo las insignias ya otorgadas (awarded_at != NULL)
      .andWhere('bp.awarded_at IS NOT NULL')
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

// ======================================
// ENDPOINTS DE RESUME (CV)
// ======================================

// OBTENER resume de un usuario
app.get('/api/users/:userId/resume', async (req, res) => {
  try {
    const { userId } = req.params;
    const repo = AppDataSource.getRepository(Resume);
    
    const resume = await repo.findOne({
      where: { id_app_user: userId }
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (e) {
    console.error('Error fetching resume:', e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR o ACTUALIZAR resume de un usuario
app.put('/api/users/:userId/resume', async (req, res) => {
  try {
    const { userId } = req.params;
    const { description, experience, courses, projects, languages, references_cv } = req.body ?? {};
    
    const repo = AppDataSource.getRepository(Resume);
    
    // Buscar si ya existe un resume para este usuario
    let resume = await repo.findOne({
      where: { id_app_user: userId }
    });
    
    if (resume) {
      // ACTUALIZAR: solo los campos que se envían (no null/undefined)
      if (description !== undefined) resume.description = description?.trim() || null;
      if (experience !== undefined) resume.experience = experience?.trim() || null;
      if (courses !== undefined) resume.courses = courses?.trim() || null;
      if (projects !== undefined) resume.projects = projects?.trim() || null;
      if (languages !== undefined) resume.languages = languages?.trim() || null;
      if (references_cv !== undefined) resume.references_cv = references_cv?.trim() || null;
      
      await repo.save(resume);
      console.log(`✅ Resume actualizado para usuario ${userId}`);
    } else {
      // CREAR: nuevo resume
      resume = repo.create({
        id_app_user: userId,
        description: description?.trim() || null,
        experience: experience?.trim() || null,
        courses: courses?.trim() || null,
        projects: projects?.trim() || null,
        languages: languages?.trim() || null,
        references_cv: references_cv?.trim() || null
      });
      
      await repo.save(resume);
      console.log(`✅ Resume creado para usuario ${userId}`);
    }

    // 🎯 ACTUALIZAR PROGRESO DE MISIONES DE TIPO CV
    try {
      const missionRepo = AppDataSource.getRepository(Mission);
      const userMissionRepo = AppDataSource.getRepository(UserMissionProgress);
      
      // Buscar misiones activas de tipo CV
      const cvMissions = await missionRepo.find({
        where: {
          category: MissionCategory.CV,
          is_active: true
        }
      });

      console.log(`📋 Encontradas ${cvMissions.length} misiones de tipo CV activas`);

      for (const mission of cvMissions) {
        // Buscar el progreso del usuario para esta misión
        const userMission = await userMissionRepo.findOne({
          where: {
            user_id: userId,
            mission_id: mission.mission_id,
            status: In(['not_started', 'in_progress'])
          }
        });

        if (userMission) {
          console.log(`🎯 Actualizando misión CV: ${mission.title} para usuario ${userId}`);
          
          // Calcular el progreso basado en cuántos campos están completos
          const totalFields = 6; // description, experience, courses, projects, languages, references_cv
          let filledFields = 0;
          if (resume.description) filledFields++;
          if (resume.experience) filledFields++;
          if (resume.courses) filledFields++;
          if (resume.projects) filledFields++;
          if (resume.languages) filledFields++;
          if (resume.references_cv) filledFields++;

          // El progreso puede ser el porcentaje de campos completados
          // o simplemente incrementar en 1 cada vez que se actualiza el CV
          const newProgress = Math.min(userMission.progress + 1, mission.objective);
          
          userMission.progress = newProgress;
          userMission.status = 'in_progress';

          // Verificar si se completó la misión
          if (userMission.progress >= mission.objective) {
            userMission.status = 'completed';
            userMission.completed_at = new Date();
            
            console.log(`🎉 ¡Misión CV completada! "${mission.title}"`);
            console.log(`🏆 Recompensa: +${mission.xp_reward} XP`);

            // Otorgar XP al usuario
            const userProgressRepo = AppDataSource.getRepository(UserProgress);
            let userProgress = await userProgressRepo.findOne({
              where: { user_id: userId }
            });

            if (!userProgress) {
              userProgress = userProgressRepo.create({
                user_id: userId,
                magento_points: mission.xp_reward,
                streak: 0,
                has_done_today: false
              });
            } else {
              userProgress.magento_points += mission.xp_reward;
              userProgress.updated_at = new Date();
            }

            await userProgressRepo.save(userProgress);
            console.log(`✅ XP otorgados al usuario ${userId}: +${mission.xp_reward} (Total: ${userProgress.magento_points})`);
          }

          await userMissionRepo.save(userMission);
          console.log(`✅ Progreso de misión CV actualizado: ${userMission.progress}/${mission.objective}`);
        }
      }
    } catch (missionError) {
      console.error('⚠️ Error al actualizar progreso de misiones CV:', missionError);
      // No fallar la respuesta si hay error en las misiones
    }

    // ===============================================
    // ACTUALIZAR BADGES DE TIPO CV (Onboarding 10/50/100)
    // ===============================================
    try {
      // Recalcular campos completados con el resume guardado
      const fields = [
        resume.description,
        resume.experience,
        resume.courses,
        resume.projects,
        resume.languages,
        resume.references_cv
      ];
      const filledCount = fields.reduce((acc, v) => acc + (v && v.toString().trim() !== '' ? 1 : 0), 0);

      const checks: Array<{ min: number; badgeName: string }> = [
        { min: 1, badgeName: 'Onboarding 10%' },
        { min: 3, badgeName: 'Onboarding 50%' },
        { min: 6, badgeName: 'Onboarding 100%' },
      ];

      for (const c of checks) {
        if (filledCount >= c.min) {
          // Asegurar que exista la fila badge_progress
          await AppDataSource.query(
            `
            INSERT INTO badge_progress (user_id, badge_id, progress, awarded_at)
            SELECT $1, b.badge_id, 0, NULL
            FROM badge b
            WHERE b.badge_name = $2
            ON CONFLICT (user_id, badge_id) DO NOTHING
            `,
            [userId, c.badgeName]
          );

          // Intentar marcar la badge como otorgada solo si no estaba otorgada
          const updated = await AppDataSource.query(
            `
            UPDATE badge_progress bp
            SET
              progress = COALESCE(b.quantity, 1),
              awarded_at = NOW()
            FROM badge b
            WHERE bp.badge_id = b.badge_id
              AND bp.user_id = $1
              AND b.badge_name = $2
              AND bp.awarded_at IS NULL
            RETURNING bp.badge_id AS badge_id, bp.progress AS progress, bp.awarded_at AS awarded_at, b.badge_name AS badge_name, b.badge_score AS badge_score
            `,
            [userId, c.badgeName]
          );
          console.log(updated)
          console.log(updated[0][0].badge_score)
          if (updated && updated.length) {
            const totalToAdd = updated[0][0].badge_score
            if (totalToAdd > 0) {
              await AppDataSource.query(
                `UPDATE user_progress SET magento_points = magento_points + $2, updated_at = NOW() WHERE user_id = $1`,
                [userId, totalToAdd]
              );
              console.log(`💰 Añadidos ${totalToAdd} MagnetoPoints por badges CV al usuario ${userId}`);
            }

            for (const r of updated[0]) {
              console.log(`🏅 Badge otorgada: ${r.badge_name} -> ${r.progress} (score ${r.badge_score})`);
              
              // 🔔 Crear notificación de badge otorgada
              await createBadgeAwardNotification(userId, r.badge_name, r.badge_score, 'CV');
            }
          }
        }
      }
    } catch (badgeErr) {
      console.error('❌ Error actualizando badges CV:', badgeErr);
      // No fallar la petición principal por errores en badges
    }

    res.json(resume);
  } catch (e) {
    console.error('Error updating/creating resume:', e);
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
      // 1) Asegurar que existan las filas badge_progress para todos los badges de categoría 'Trivia'
      //    Insertamos solo badges con quantity IS NOT NULL (los de intentos tienen quantity)
      await AppDataSource.query(
        `
        INSERT INTO badge_progress (user_id, badge_id, progress, awarded_at)
        SELECT $1, b.badge_id, 0, NULL
        FROM badge b
        WHERE b.category = 'Trivia' AND b.quantity IS NOT NULL
        ON CONFLICT (user_id, badge_id) DO NOTHING
        `,
        [user_id]
      );

      // 2) Incrementar progress solo en badges no completados (awarded_at IS NULL)
      //    y solo hasta la cantidad objetivo (no sobrepasar).
      //    awarded_at se establece a NOW() únicamente cuando se cruza el umbral por primera vez.
      const updatedRows = await AppDataSource.query(
        `
        UPDATE badge_progress bp
        SET
          progress = LEAST(bp.progress + 1, b.quantity),
          awarded_at = CASE
            WHEN bp.progress < b.quantity
             AND bp.progress + 1 >= b.quantity
             AND bp.awarded_at IS NULL
            THEN NOW()
            ELSE bp.awarded_at
          END
        FROM badge b
        WHERE bp.badge_id = b.badge_id
          AND bp.user_id = $1
          AND b.category = 'Trivia'
          AND b.quantity IS NOT NULL
          AND bp.awarded_at IS NULL
          AND bp.progress < b.quantity
  RETURNING bp.badge_id AS badge_id, bp.progress AS progress, bp.awarded_at AS awarded_at, b.badge_name AS badge_name, b.quantity AS quantity, b.badge_score AS badge_score
        `,
        [user_id]
      );

  console.log(`📊 Actualizados ${updatedRows.length} badge_progress(es) de Trivia para user ${user_id}`);
  // Debug: inspect returned shape and badge_score
  console.log(updatedRows);
  try { console.log(updatedRows[0][0].badge_score); } catch (e) { console.log('updatedRows[0].badge_score ->', (e as any)?.message ?? e); }

      if (updatedRows && updatedRows.length) {
        const totalToAdd = updatedRows[0][0].badge_score
        if (totalToAdd > 0) {
          await AppDataSource.query(
            `UPDATE user_progress SET magento_points = magento_points + $2, updated_at = NOW() WHERE user_id = $1`,
            [user_id, totalToAdd]
          );
          console.log(`💰 Añadidos ${totalToAdd} MagnetoPoints por badges Trivia al usuario ${user_id}`);
        }

        for (const r of updatedRows[0]) {
          const name = r.badge_name || r.badge_id;
          const progress = r.progress;
          const qty = r.quantity;
          const awarded = r.awarded_at ? '🏆 awarded' : '';
          console.log(`✅ Badge "${name}" -> ${progress}/${qty} ${awarded}`);
          
          // 🔔 Crear notificación si el badge fue otorgado
          if (r.awarded_at) {
            await createBadgeAwardNotification(user_id, r.badge_name, r.badge_score, 'Trivia');
          }
        }
      }
    } catch (badgeError) {
      console.error('❌ Error al actualizar progreso de badges (trivia):', badgeError);
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
    
    // 🎯 Iniciar el servicio de rotación de misiones
    missionDelegateService.start();
    
    app.listen(PORT, (): void => console.log(`API http://localhost:${PORT}`));
  }) as TypeORMInitSuccess)
  .catch(((err: unknown): void => {
    console.error('❌ Error al conectar TypeORM', err);
    process.exit(1);
  }) as TypeORMInitError);