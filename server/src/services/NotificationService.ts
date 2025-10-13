import cron from 'node-cron';
import { AppDataSource } from '../db/data-source';
import { UserProgress } from '../entities/UserProgress';
import { AppUser } from '../entities/AppUser';
import { EmailService } from './EmailService';

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Inicializa los cron jobs para las notificaciones
   */
  public initializeCronJobs(): void {
    console.log('Initializing notification cron jobs...');

    // Cron job para las 9:00 AM hora de Colombia (UTC-5)
    // En UTC sería 14:00 (2:00 PM)
    cron.schedule('0 14 * * *', async () => {
      console.log('Running morning notification job at 9:00 AM Colombia time');
      await this.sendMorningNotifications();
    }, {
      timezone: 'America/Bogota'
    });

    // Cron job para las 6:00 PM hora de Colombia (UTC-5)
    // En UTC sería 23:00 (11:00 PM)
    cron.schedule('0 23 * * *', async () => {
      console.log('Running evening notification job at 6:00 PM Colombia time');
      await this.sendEveningNotifications();
    }, {
      timezone: 'America/Bogota'
    });

    // Cron job para resetear has_done_today a medianoche (00:00) hora de Colombia
    cron.schedule('0 5 * * *', async () => {
      console.log('Resetting daily progress at midnight Colombia time');
      await this.resetDailyProgress();
    }, {
      timezone: 'America/Bogota'
    });

    console.log('Cron jobs initialized successfully');
  }

  /**
   * Envía notificaciones matutinas a usuarios que no han completado trivia hoy
   */
  private async sendMorningNotifications(): Promise<void> {
    try {
      const usersToNotify = await this.getUsersWithoutTodayTrivia();
      
      console.log(`Sending morning notifications to ${usersToNotify.length} users`);
      console.log('Users data:', JSON.stringify(usersToNotify, null, 2));

      for (const userData of usersToNotify) {
        console.log('Processing user:', userData);
        try {
          await this.emailService.sendMorningReminder(
            userData.user_id,
            userData.email,
            userData.name
          );
          console.log(`Morning notification sent to ${userData.email}`);
        } catch (error) {
          console.error(`Failed to send morning notification to ${userData.email}:`, error);
        }
      }

      console.log('Morning notifications batch completed');
    } catch (error) {
      console.error('Error in sendMorningNotifications:', error);
    }
  }

  /**
   * Envía notificaciones vespertinas a usuarios que no han completado trivia hoy
   */
  private async sendEveningNotifications(): Promise<void> {
    try {
      const usersToNotify = await this.getUsersWithoutTodayTrivia();
      
      console.log(`Sending evening notifications to ${usersToNotify.length} users`);
      console.log('Users data:', JSON.stringify(usersToNotify, null, 2));

      for (const userData of usersToNotify) {
        console.log('Processing user:', userData);
        try {
          await this.emailService.sendEveningReminder(
            userData.user_id,
            userData.email,
            userData.name,
            userData.streak || 0
          );
          console.log(`Evening notification sent to ${userData.email} (streak: ${userData.streak || 0})`);
        } catch (error) {
          console.error(`Failed to send evening notification to ${userData.email}:`, error);
        }
      }

      console.log('Evening notifications batch completed');
    } catch (error) {
      console.error('Error in sendEveningNotifications:', error);
    }
  }

  /**
   * Obtiene usuarios que no han completado la trivia hoy
   */
  private async getUsersWithoutTodayTrivia(): Promise<any[]> {
    const userProgressRepo = AppDataSource.getRepository(UserProgress);
    
    const query = userProgressRepo
      .createQueryBuilder('up')
      .innerJoin(AppUser, 'au', 'au.id_app_user = up.user_id')
      .select('up.user_id', 'user_id')
      .addSelect('au.name', 'name')
      .addSelect('au.email', 'email')
      .addSelect('up.streak', 'streak')
      .where('up.has_done_today = :hasDoneToday', { hasDoneToday: false })
      .andWhere('au.email IS NOT NULL')
      .andWhere("au.email != ''");

    const result = await query.getRawMany();
    return result;
  }

  /**
   * Método manual para probar las notificaciones (útil para desarrollo)
   */
  public async testMorningNotifications(): Promise<void> {
    console.log('Testing morning notifications...');
    await this.sendMorningNotifications();
  }

  /**
   * Método manual para probar las notificaciones (útil para desarrollo)
   */
  public async testEveningNotifications(): Promise<void> {
    console.log('Testing evening notifications...');
    await this.sendEveningNotifications();
  }

  /**
   * Resetea el has_done_today a false para todos los usuarios
   */
  private async resetDailyProgress(): Promise<void> {
    try {
      const userProgressRepo = AppDataSource.getRepository(UserProgress);
      
      const result = await userProgressRepo.update(
        {}, // Actualizar todos los registros
        { has_done_today: false }
      );

      console.log(`Daily progress reset completed. ${result.affected} records updated.`);
    } catch (error) {
      console.error('Error resetting daily progress:', error);
    }
  }
}