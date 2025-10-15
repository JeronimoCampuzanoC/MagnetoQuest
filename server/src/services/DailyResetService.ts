import * as cron from 'node-cron';
import { AppDataSource } from '../db/data-source';
import { UserProgress } from '../entities/UserProgress';

export class DailyResetService {
  private static instance: DailyResetService;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): DailyResetService {
    if (!DailyResetService.instance) {
      DailyResetService.instance = new DailyResetService();
    }
    return DailyResetService.instance;
  }

  /**
   * Inicia el cron job que se ejecuta todos los días a medianoche (00:00)
   */
  public start(): void {
    if (this.cronJob) {
      console.log('⚠️  [DailyResetService] El servicio ya está en ejecución');
      return;
    }

    // Ejecutar todos los días a medianoche (00:00)
    // Formato: segundo minuto hora dia mes dia-semana
    // '0 0 * * *' = 00:00 todos los días
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      await this.performDailyReset();
    }, {
      timezone: 'America/Bogota' // Ajusta según tu zona horaria
    });

    console.log('✅ [DailyResetService] Servicio iniciado - Se ejecutará todos los días a medianoche');
    console.log('🕐 [DailyResetService] Zona horaria: America/Bogota');
  }

  /**
   * Detiene el cron job
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 [DailyResetService] Servicio detenido');
    }
  }

  /**
   * Ejecuta el reset diario manualmente (útil para testing)
   */
  public async performDailyReset(): Promise<void> {
    try {
      console.log('🌅 [DailyResetService] ====== INICIANDO RESET DIARIO ======');
      console.log(`🕐 [DailyResetService] Hora: ${new Date().toISOString()}`);

      const userProgressRepo = AppDataSource.getRepository(UserProgress);

      // 1️⃣ PASO 1: Resetear streak a 0 para usuarios que NO completaron su trivia ayer
      // (has_done_today = false significa que no hicieron nada ayer)
      const usersToResetStreak = await userProgressRepo
        .createQueryBuilder()
        .update(UserProgress)
        .set({ streak: 0 })
        .where('has_done_today = :hasDone', { hasDone: false })
        .andWhere('streak > :streak', { streak: 0 }) // Solo resetear si tienen streak > 0
        .execute();

      console.log(`❌ [DailyResetService] Streaks reseteados: ${usersToResetStreak.affected || 0} usuarios perdieron su racha`);

      // 2️⃣ PASO 2: Resetear has_done_today a false para TODOS los usuarios
      // (nuevo día, todos empiezan sin haber completado su trivia)
      const allUsersReset = await userProgressRepo
        .createQueryBuilder()
        .update(UserProgress)
        .set({ 
          has_done_today: false,
          updated_at: new Date()
        })
        .execute();

      console.log(`🔄 [DailyResetService] has_done_today reseteado: ${allUsersReset.affected || 0} usuarios`);
      
      // 3️⃣ PASO 3: Obtener estadísticas de usuarios con streaks activos
      const activeStreaks = await userProgressRepo
        .createQueryBuilder('up')
        .select('COUNT(*)', 'total')
        .addSelect('MAX(up.streak)', 'max_streak')
        .addSelect('AVG(up.streak)', 'avg_streak')
        .where('up.streak > :zero', { zero: 0 })
        .getRawOne();

      console.log('📊 [DailyResetService] Estadísticas de streaks activos:');
      console.log(`   - Total usuarios con streak activo: ${activeStreaks?.total || 0}`);
      console.log(`   - Streak máximo: ${activeStreaks?.max_streak || 0} días`);
      console.log(`   - Streak promedio: ${Math.round(activeStreaks?.avg_streak || 0)} días`);

      console.log('✅ [DailyResetService] ====== RESET DIARIO COMPLETADO ======\n');

    } catch (error) {
      console.error('❌ [DailyResetService] Error durante el reset diario:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  public getStatus(): { isRunning: boolean; nextExecution: string | null } {
    return {
      isRunning: this.cronJob !== null,
      nextExecution: this.cronJob ? 'Todos los días a las 00:00' : null
    };
  }
}

// Exportar instancia singleton
export const dailyResetService = DailyResetService.getInstance();
