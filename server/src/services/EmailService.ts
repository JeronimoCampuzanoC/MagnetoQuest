import nodemailer from 'nodemailer';
import { AppDataSource } from '../db/data-source';
import { UserProgress } from '../entities/UserProgress';
import { AppUser } from '../entities/AppUser';
import { NotificationLog } from '../entities/NotificationLog';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuración del transporter - usar variables de entorno para producción
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMotivationalEmail(
    email: string,
    name: string,
    subject: string,
    htmlContent: string,
    userId: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@magnetoquest.com',
        to: email,
        subject: subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      
      // Registrar la notificación en la base de datos
      await this.logNotification(userId, 'email', 'motivational_reminder', {
        subject: subject,
        recipient: email,
        sent_at: new Date().toISOString()
      });
      
      console.log(`Email sent successfully to ${email}`);
    } catch (error) {
      console.error(`Error sending email to ${email}:`, error);
      throw error;
    }
  }

  private async logNotification(
    userId: string,
    channel: string,
    template: string,
    metadata: any
  ): Promise<void> {
    try {
      const notificationRepo = AppDataSource.getRepository(NotificationLog);
      await notificationRepo.save({
        user_id: userId,
        channel: channel,
        template: template,
        metadata: metadata,
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Envía un email de bienvenida al nuevo usuario
   */
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    if (!email) {
      console.log('No email provided for welcome notification');
      return;
    }

    const firstName = name.split(' ')[0];
    const subject = '¡Bienvenido a MagnetoQuest! 🎮';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
          }
          .welcome-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0; 
          }
          .welcome-subtitle { 
            font-size: 16px; 
            margin-top: 10px; 
            opacity: 0.9; 
          }
          .missions-box {
            background: white;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .mission-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .mission-item:last-child {
            border-bottom: none;
          }
          .mission-icon {
            display: inline-block;
            width: 30px;
            text-align: center;
            font-size: 20px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="welcome-title">¡Bienvenido a MagnetoQuest!</h1>
            <p class="welcome-subtitle">Tu aventura gamificada comienza ahora 🚀</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${firstName}</strong>,</p>
            
            <p>¡Es un placer tenerte con nosotros! Has dado el primer paso hacia una experiencia única de aprendizaje y crecimiento profesional.</p>
            
            <div class="missions-box">
              <h3 style="margin-top: 0; color: #667eea;">🎯 Tus Primeras Misiones</h3>
              <p>Hemos preparado misiones especiales para ti:</p>
              
              <div class="mission-item">
                <span class="mission-icon">⚡</span>
                <strong>1 Misión Flash</strong> - ¡Completala rápido para ganar puntos extra!
              </div>
              
              <div class="mission-item">
                <span class="mission-icon">📅</span>
                <strong>1 Misión Diaria</strong> - Renueva cada noche para practicar constantemente
              </div>
              
              <div class="mission-item">
                <span class="mission-icon">📊</span>
                <strong>2 Misiones Semanales</strong> - Trivias especiales para demostrar tus habilidades
              </div>
              
              <div class="mission-item">
                <span class="mission-icon">🏆</span>
                <strong>2 Misiones Mensuales</strong> - Proyectos, certificados y CV para destacar
              </div>
            </div>
            
            <p><strong>💎 Sistema de Recompensas:</strong></p>
            <ul>
              <li>Gana <strong>MagnetoPoints</strong> completando misiones</li>
              <li>Desbloquea <strong>badges</strong> exclusivos</li>
              <li>Mantén tu <strong>racha</strong> diaria activa</li>
              <li>Completa misiones rápido para ganar <strong>bonos de velocidad</strong> (70%-100%)</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/misiones" class="cta-button">
                Ver Mis Misiones 🎮
              </a>
            </center>
            
            <p style="margin-top: 30px;">Recuerda que cada día es una oportunidad para mejorar. ¡Nos vemos en el tablero!</p>
            
            <p style="margin-top: 20px;">
              Saludos,<br>
              <strong>El equipo de MagnetoQuest</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@magnetoquest.com',
        to: email,
        subject: subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      
      console.log(`Welcome email sent to ${email} for user "${name}"`);
    } catch (error) {
      console.error(`Error sending welcome email to ${email}:`, error);
      throw error;
    }
  }

  async sendMorningReminder(userId: string, email: string, name: string): Promise<void> {
    // Validación de parámetros
    if (!name || !email || !userId) {
      console.error('Missing required parameters:', { userId, email, name });
      throw new Error('Missing required parameters for morning reminder');
    }

    const firstName = name.split(' ')[0];
    const subject = 'Hoy es un día perfecto para aprender 🚀';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">¡Hola, ${firstName}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Hoy es un día maravilloso para seguir aprendiendo y poner a prueba tus conocimientos. ✨ 
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Entra a tu trivia de <strong>MagnetoQuest</strong> y suma progreso—¡tu yo del futuro te lo agradecerá!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trivia" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            ¡Empezar Trivia! 🚀
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          MagnetoQuest - Tu carrera profesional empieza aquí
        </p>
      </div>
    `;

    await this.sendMotivationalEmail(email, name, subject, htmlContent, userId);
  }

  async sendEveningReminder(userId: string, email: string, name: string, streak: number = 0): Promise<void> {
    // Validación de parámetros
    if (!name || !email || !userId) {
      console.error('Missing required parameters:', { userId, email, name });
      throw new Error('Missing required parameters for evening reminder');
    }

    const firstName = name.split(' ')[0];
    const subject = 'Aún estás a tiempo ⏳';
    
    // Mensaje personalizado según la racha
    let streakMessage = '';
    let streakEmoji = '';
    
    if (streak > 0) {
      const streakText = streak === 1 ? 'día' : 'días';
      
      // Emojis diferentes según la racha
      if (streak >= 30) streakEmoji = '👑';
      else if (streak >= 14) streakEmoji = '💎';
      else if (streak >= 7) streakEmoji = '🏆';
      else if (streak >= 3) streakEmoji = '🔥';
      else streakEmoji = '⚡';
      
      let motivationalText = '';
      if (streak >= 30) motivationalText = '¡Eres una leyenda del aprendizaje!';
      else if (streak >= 14) motivationalText = '¡Increíble dedicación!';
      else if (streak >= 7) motivationalText = '¡Vas por muy buen camino!';
      else if (streak >= 3) motivationalText = '¡Excelente consistencia!';
      else motivationalText = '¡Sigue así!';
      
      streakMessage = `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 18px; text-align: center;">
            ${streakEmoji} Racha de ${streak} ${streakText} ${streakEmoji}
          </p>
          <p style="margin: 10px 0 5px 0; color: #92400e; font-size: 14px; text-align: center; font-style: italic;">
            ${motivationalText}
          </p>
          <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px; font-weight: bold; text-align: center;">
            ⚠️ Si no completas tu trivia hoy, perderás toda tu racha y tendrás que empezar desde cero.
          </p>
        </div>`;
    } else {
      streakMessage = `
        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-weight: bold; color: #1e40af; font-size: 18px; text-align: center;">
            🚀 ¡Empieza tu racha hoy! 🚀
          </p>
          <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px; text-align: center;">
            Completa tu trivia y comienza a construir tu racha de aprendizaje. ¡Cada experto fue una vez un principiante!
          </p>
        </div>`;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; text-align: center;">¡Hola, ${firstName}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Se está haciendo tarde… ⏳ 
        </p>
        
        ${streakMessage}
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          Aprovecha y completa tu misión de hoy en <strong>MagnetoQuest</strong> para mantener viva tu racha. 
          ¡Un pequeño paso más!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/trivia" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            ${streak > 0 ? '🔥 ¡Mantén tu racha!' : '🚀 ¡Empezar Trivia!'}
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          MagnetoQuest - ${streak > 0 ? 'No pierdas tu racha' : 'Tu carrera profesional empieza aquí'}
        </p>
      </div>
    `;

    await this.sendMotivationalEmail(email, name, subject, htmlContent, userId);
  }

  async sendMissionDeadlineReminder(
    userId: string, 
    email: string, 
    name: string, 
    missionTitle: string,
    hoursRemaining: number,
    progress: number
  ): Promise<void> {
    // Validación de parámetros
    if (!name || !email || !userId || !missionTitle) {
      console.error('Missing required parameters:', { userId, email, name, missionTitle });
      throw new Error('Missing required parameters for mission deadline reminder');
    }

    const firstName = name.split(' ')[0];
    const subject = `⏰ Tu misión "${missionTitle}" vence pronto`;
    
    // Calcular tiempo restante en formato legible
    let timeRemaining = '';
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      timeRemaining = `${minutesRemaining} minutos`;
    } else if (hoursRemaining < 24) {
      timeRemaining = `${Math.floor(hoursRemaining)} horas`;
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      const remainingHours = Math.floor(hoursRemaining % 24);
      timeRemaining = daysRemaining === 1 
        ? `1 día${remainingHours > 0 ? ` y ${remainingHours} horas` : ''}`
        : `${daysRemaining} días${remainingHours > 0 ? ` y ${remainingHours} horas` : ''}`;
    }

    // Mensaje de urgencia según el tiempo restante
    let urgencyLevel = '';
    let backgroundColor = '';
    let borderColor = '';
    let urgencyEmoji = '';
    
    if (hoursRemaining < 6) {
      urgencyLevel = '🚨 ¡URGENTE! ¡Solo quedan pocas horas!';
      backgroundColor = '#fef2f2';
      borderColor = '#dc2626';
      urgencyEmoji = '🚨';
    } else if (hoursRemaining < 24) {
      urgencyLevel = '⚠️ ¡Atención! Menos de un día restante';
      backgroundColor = '#fef3c7';
      borderColor = '#f59e0b';
      urgencyEmoji = '⚠️';
    } else {
      urgencyLevel = '⏰ Recordatorio: Tu misión vence pronto';
      backgroundColor = '#dbeafe';
      borderColor = '#3b82f6';
      urgencyEmoji = '⏰';
    }

    // Mensaje de progreso
    let progressMessage = '';
    if (progress === 100) {
      progressMessage = '🎉 ¡Genial! Has completado esta misión. Solo falta marcarla como terminada.';
    } else if (progress >= 75) {
      progressMessage = `🔥 ¡Excelente progreso! Vas al ${progress}%. ¡Ya casi terminas!`;
    } else if (progress >= 50) {
      progressMessage = `💪 Buen avance: ${progress}% completado. ¡Sigue así!`;
    } else if (progress >= 25) {
      progressMessage = `🚀 Progreso: ${progress}% completado. ¡Puedes lograrlo!`;
    } else {
      progressMessage = `⭐ Progreso: ${progress}% completado. ¡Es momento de acelerar!`;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937; text-align: center;">¡Hola, ${firstName}!</h2>
        
        <div style="background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin: 0; font-weight: bold; color: #1f2937; font-size: 18px; text-align: center;">
            ${urgencyLevel}
          </p>
          <p style="margin: 15px 0 5px 0; color: #374151; font-size: 16px; text-align: center;">
            <strong>"${missionTitle}"</strong>
          </p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
            ⏳ Tiempo restante: <strong>${timeRemaining}</strong>
          </p>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; color: #374151; font-size: 14px;">
            ${progressMessage}
          </p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; text-align: center;">
          ${hoursRemaining < 6 
            ? '¡No dejes que se te escape! Completa tu misión ahora mismo.' 
            : 'Aprovecha el tiempo que te queda para completar esta misión.'
          }
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/missions" 
             style="background-color: ${borderColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            ${urgencyEmoji} ¡Ir a Misiones!
          </a>
        </div>

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
          MagnetoQuest - No dejes que las oportunidades se escapen
        </p>
      </div>
    `;

    // Usar método específico para mission deadline en lugar de sendMotivationalEmail
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@magnetoquest.com',
        to: email,
        subject: subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      
      // Registrar la notificación con template específico para mission deadline
      await this.logNotification(userId, 'email', 'mission_deadline_reminder', {
        mission_title: missionTitle,
        hours_remaining: hoursRemaining,
        progress: progress,
        urgency_level: hoursRemaining < 6 ? 'urgent' : hoursRemaining < 24 ? 'warning' : 'reminder',
        subject: subject,
        recipient: email,
        sent_at: new Date().toISOString()
      });
      
      console.log(`Mission deadline notification sent to ${email} for "${missionTitle}"`);
    } catch (error) {
      console.error(`Error sending mission deadline email to ${email}:`, error);
      throw error;
    }
  }

  async sendApplicationMissionReminder(
    userId: string,
    email: string,
    name: string,
    missionTitle: string,
    missionDescription: string,
    hoursRemaining: number
  ): Promise<void> {
    // Validación de parámetros
    if (!name || !email || !userId || !missionTitle || !missionDescription) {
      console.error('Missing required parameters:', { userId, email, name, missionTitle });
      throw new Error('Missing required parameters for application mission reminder');
    }

    const firstName = name.split(' ')[0];
    const subject = `💼 Oportunidad laboral esperando por ti: ${missionTitle}`;
    
    // Calcular tiempo restante en formato legible
    let timeRemaining = '';
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      timeRemaining = `${minutesRemaining} minutos`;
    } else if (hoursRemaining < 24) {
      timeRemaining = `${Math.floor(hoursRemaining)} horas`;
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      timeRemaining = daysRemaining === 1 ? '1 día' : `${daysRemaining} días`;
    }

    // Mensaje de urgencia según el tiempo restante
    let urgencyMessage = '';
    let backgroundColor = '';
    let borderColor = '';
    let ctaColor = '';
    
    if (hoursRemaining < 6) {
      urgencyMessage = '🚨 ¡ÚLTIMA OPORTUNIDAD! Esta vacante cierra en pocas horas';
      backgroundColor = '#fef2f2';
      borderColor = '#dc2626';
      ctaColor = '#dc2626';
    } else if (hoursRemaining < 24) {
      urgencyMessage = '⚡ ¡URGENTE! La vacante cierra pronto';
      backgroundColor = '#fef3c7';
      borderColor = '#f59e0b';
      ctaColor = '#f59e0b';
    } else {
      urgencyMessage = '💼 Nueva oportunidad laboral disponible';
      backgroundColor = '#dbeafe';
      borderColor = '#3b82f6';
      ctaColor = '#3b82f6';
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💼 MagnetoQuest</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Conectamos talento con oportunidades</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">¡Hola, ${firstName}!</h2>
            
            <div style="background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #1f2937; font-size: 16px;">
                ${urgencyMessage}
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                ⏳ Tiempo restante: <strong style="color: ${borderColor}">${timeRemaining}</strong>
              </p>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6366f1;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 ${missionTitle}</h3>
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0;">
                ${missionDescription}
              </p>
            </div>

            <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                <strong>💡 ¿Por qué aplicar ahora?</strong><br>
                • Esta oportunidad está seleccionada especialmente para tu perfil<br>
                • Las empresas buscan activamente candidatos como tú<br>
                • Aplicar rápido aumenta tus posibilidades de ser considerado<br>
                • Al completar esta misión, ganarás <strong>100 MagnetoPoints</strong> 🎯
              </p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #374151; text-align: center; margin: 20px 0;">
              ${hoursRemaining < 6 
                ? '⚡ <strong>¡No dejes pasar esta oportunidad!</strong> Las mejores vacantes se llenan rápido.' 
                : '🎯 <strong>Da el siguiente paso en tu carrera profesional.</strong> Esta oportunidad podría ser exactamente lo que buscas.'
              }
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/empleos" 
                 style="background-color: ${ctaColor}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                💼 Ver Vacante y Aplicar
              </a>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 13px; margin: 0;">
                ¿No estás interesado? <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/misiones" style="color: #6366f1; text-decoration: none;">Ver todas las misiones</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
              MagnetoQuest - Tu próxima oportunidad está aquí
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              Este mensaje fue enviado porque tienes una misión de aplicación pendiente.<br>
              Puedes gestionar tus notificaciones en la configuración de tu cuenta.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@magnetoquest.com',
        to: email,
        subject: subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      
      // Registrar la notificación
      await this.logNotification(userId, 'email', 'application_mission_reminder', {
        mission_title: missionTitle,
        mission_description: missionDescription,
        hours_remaining: hoursRemaining,
        urgency_level: hoursRemaining < 6 ? 'urgent' : hoursRemaining < 24 ? 'warning' : 'reminder',
        subject: subject,
        recipient: email,
        sent_at: new Date().toISOString()
      });
      console.log(`Application mission notification sent to ${email} for "${missionTitle}"`);
    } catch (error) {
      console.error(`Error sending application mission email to ${email}:`, error);
      throw error;
    }
  }
}