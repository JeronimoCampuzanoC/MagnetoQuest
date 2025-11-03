import { AppDataSource } from '../db/data-source';
import { Mission, MissionFrequency } from '../entities/Mission';
import { UserMissionProgress } from '../entities/UserMissionProgress';
import { AppUser } from '../entities/AppUser';
import { LessThan } from 'typeorm';
import * as cron from 'node-cron';

/**
 * Servicio para gestionar la asignación y rotación de misiones
 * Se ejecuta automáticamente todas las noches a las 00:00
 */
class MissionDelegateService {
  private cronJob: any | null = null;

  /**
   * Inicia el servicio de delegación de misiones
   * Programa la ejecución diaria a las 00:00 (medianoche) en zona horaria de Bogotá
   */
  start(): void {
    if (this.cronJob) {
      console.log('⚠️ MissionDelegate ya está en ejecución');
      return;
    }

    // Ejecutar todos los días a medianoche (00:00) en zona horaria de Bogotá
    this.cronJob = cron.schedule(
      '0 0 * * *',
      async () => {
        console.log('🔄 [MissionDelegate] Iniciando barrido nocturno de misiones...');
        await this.performMissionRotation();
      },
      {
        timezone: 'America/Bogota'
      }
    );

    console.log('✅ MissionDelegate iniciado - Ejecutará diariamente a las 00:00 (Bogotá)');
  }

  /**
   * Detiene el servicio de delegación de misiones
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 MissionDelegate detenido');
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus(): { isRunning: boolean; nextExecution: string } {
    return {
      isRunning: this.cronJob !== null,
      nextExecution: this.cronJob ? 'Próxima ejecución: 00:00 (Bogotá)' : 'No programado'
    };
  }

  /**
   * Realiza la rotación de misiones caducadas
   * - Elimina misiones caducadas (ends_at < NOW())
   * - Asigna nuevas misiones aleatorias de la misma frecuencia
   */
  async performMissionRotation(): Promise<void> {
    try {
      const now = new Date();
      console.log(`📅 [MissionDelegate] Fecha actual: ${now.toISOString()}`);

      const userMissionRepo = AppDataSource.getRepository(UserMissionProgress);
      const missionRepo = AppDataSource.getRepository(Mission);
      const userRepo = AppDataSource.getRepository(AppUser);

      // 1. Buscar misiones caducadas (ends_at < now)
      const expiredMissions = await userMissionRepo.find({
        where: {
          ends_at: LessThan(now)
        },
        relations: ['mission']
      });

      console.log(`🔍 [MissionDelegate] Encontradas ${expiredMissions.length} misiones caducadas`);

      if (expiredMissions.length === 0) {
        console.log('✅ [MissionDelegate] No hay misiones caducadas. Proceso completado.');
        return;
      }

      // 2. Agrupar misiones caducadas por usuario y frecuencia
      const userMissionMap = new Map<string, Map<MissionFrequency, UserMissionProgress[]>>();

      for (const expiredMission of expiredMissions) {
        const userId = expiredMission.user_id;
        const frequency = expiredMission.mission.frequency;

        if (!userMissionMap.has(userId)) {
          userMissionMap.set(userId, new Map());
        }

        const userFrequencyMap = userMissionMap.get(userId)!;
        if (!userFrequencyMap.has(frequency)) {
          userFrequencyMap.set(frequency, []);
        }

        userFrequencyMap.get(frequency)!.push(expiredMission);
      }

      // 3. Para cada usuario, eliminar misiones caducadas y asignar nuevas
      for (const [userId, frequencyMap] of userMissionMap) {
        console.log(`👤 [MissionDelegate] Procesando usuario: ${userId}`);

        for (const [frequency, missions] of frequencyMap) {
          console.log(`  📊 Frecuencia: ${frequency} - ${missions.length} misiones caducadas`);

          // Eliminar misiones caducadas
          for (const mission of missions) {
            await userMissionRepo.remove(mission);
            console.log(`    ❌ Misión eliminada: "${mission.mission.title}" (ID: ${mission.mission_id})`);
          }

          // Asignar nuevas misiones aleatorias de la misma frecuencia
          const countToAssign = missions.length;
          await this.assignRandomMissions(userId, frequency, countToAssign);
        }
      }

      console.log('✅ [MissionDelegate] Rotación de misiones completada exitosamente');
    } catch (error) {
      console.error('❌ [MissionDelegate] Error en la rotación de misiones:', error);
      throw error;
    }
  }

  /**
   * Asigna misiones aleatorias a un usuario según la frecuencia
   * @param userId ID del usuario
   * @param frequency Frecuencia de la misión (daily, flash, weekly, monthly)
   * @param count Cantidad de misiones a asignar
   */
  private async assignRandomMissions(
    userId: string,
    frequency: MissionFrequency,
    count: number
  ): Promise<void> {
    try {
      const missionRepo = AppDataSource.getRepository(Mission);
      const userMissionRepo = AppDataSource.getRepository(UserMissionProgress);

      // Obtener todas las misiones activas de esta frecuencia
      const availableMissions = await missionRepo.find({
        where: {
          frequency: frequency,
          is_active: true
        }
      });

      if (availableMissions.length === 0) {
        console.log(`    ⚠️ No hay misiones disponibles para frecuencia: ${frequency}`);
        return;
      }

      // Obtener misiones que el usuario ya tiene (para evitar duplicados)
      const userMissions = await userMissionRepo.find({
        where: { user_id: userId },
        relations: ['mission']
      });

      const userMissionIds = new Set(userMissions.map(um => um.mission_id));

      // Filtrar misiones que el usuario NO tiene asignadas
      const newAvailableMissions = availableMissions.filter(
        m => !userMissionIds.has(m.mission_id)
      );

      if (newAvailableMissions.length === 0) {
        console.log(`    ⚠️ El usuario ya tiene todas las misiones de frecuencia: ${frequency}`);
        return;
      }

      // Seleccionar misiones aleatorias
      const missionsToAssign = this.selectRandomMissions(newAvailableMissions, count);

      // Calcular fechas según la frecuencia
      const now = new Date();
      const startsAt = now;
      const endsAt = this.calculateEndDate(now, frequency);

      // Crear y guardar las nuevas misiones
      for (const mission of missionsToAssign) {
        const newUserMission = userMissionRepo.create({
          user_id: userId,
          mission_id: mission.mission_id,
          status: 'not_started',
          progress: 0,
          starts_at: startsAt,
          ends_at: endsAt
        });

        await userMissionRepo.save(newUserMission);
        console.log(`    ✅ Nueva misión asignada: "${mission.title}" (Vence: ${endsAt.toISOString()})`);
      }
    } catch (error) {
      console.error(`    ❌ Error asignando misiones para frecuencia ${frequency}:`, error);
      throw error;
    }
  }

  /**
   * Selecciona misiones aleatorias de un arreglo
   * @param missions Arreglo de misiones disponibles
   * @param count Cantidad de misiones a seleccionar
   * @returns Arreglo de misiones seleccionadas aleatoriamente
   */
  private selectRandomMissions(missions: Mission[], count: number): Mission[] {
    const shuffled = [...missions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, missions.length));
  }

  /**
   * Calcula la fecha de vencimiento según la frecuencia
   * @param startDate Fecha de inicio
   * @param frequency Frecuencia de la misión
   * @returns Fecha de vencimiento
   */
  private calculateEndDate(startDate: Date, frequency: MissionFrequency): Date {
    const endDate = new Date(startDate);

    switch (frequency) {
      case MissionFrequency.DAILY:
        // Vence al final del día (23:59:59)
        endDate.setHours(23, 59, 59, 999);
        break;

      case MissionFrequency.FLASH:
        // Misiones flash duran 6 horas
        endDate.setHours(endDate.getHours() + 6);
        break;

      case MissionFrequency.WEEKLY:
        // Vence en 7 días
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        break;

      case MissionFrequency.MONTHLY:
        // Vence en 30 días
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Por defecto, 7 días
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
    }

    return endDate;
  }

  /**
   * Método para ejecutar manualmente la rotación (útil para testing)
   */
  async executeManually(): Promise<void> {
    console.log('🔧 [MissionDelegate] Ejecución manual solicitada');
    await this.performMissionRotation();
  }

  /**
   * Verifica si el servicio está activo
   */
  isRunning(): boolean {
    return this.cronJob !== null;
  }
}

// Exportar una instancia única (singleton)
export const missionDelegateService = new MissionDelegateService();
