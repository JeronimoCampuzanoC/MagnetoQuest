# Sistema de Notificaciones Motivacionales - MagnetoQuest

Este sistema implementa recordatorios automáticos tipo Duolingo para mantener a los usuarios activos en MagnetoQuest.

## Características

- **Notificaciones automáticas** a las 9:00 AM y 6:00 PM hora de Colombia
- **Filtrado inteligente** - solo se envía a usuarios que no han completado la trivia del día
- **Emails personalizados** con el nombre del usuario
- **Seguimiento de rachas** y puntos MagnetoQuest
- **Logging completo** de todas las notificaciones enviadas

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `server/` basado en `.env.example`:

```bash
# Configuración de Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@magnetoquest.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Configuración de Gmail (Recomendado)

1. Ve a tu cuenta de Google
2. Activa la autenticación de dos factores
3. Genera una "Contraseña de aplicación" específica
4. Usa esa contraseña en `SMTP_PASS`

### 3. Base de Datos

La tabla `user_progress` se creará automáticamente con la migración. Incluye:

- `streak`: Días consecutivos de actividad
- `has_done_today`: Si completó la trivia hoy
- `magento_points`: Puntos acumulados

## Cron Jobs Configurados

| Hora     | Descripción                      | Zona Horaria   |
| -------- | -------------------------------- | -------------- |
| 9:00 AM  | Recordatorio matutino            | America/Bogota |
| 6:00 PM  | Recordatorio vespertino          | America/Bogota |
| 12:00 AM | Reset diario de `has_done_today` | America/Bogota |

## API Endpoints

### Gestión de Progreso del Usuario

```bash
# Obtener progreso del usuario
GET /api/users/:userId/progress

# Marcar trivia como completada
PUT /api/users/:userId/progress/trivia-completed

# Reset diario manual (admin)
POST /api/admin/reset-daily-progress
```

### Testing de Notificaciones

```bash
# Probar notificación matutina
POST /api/test/notifications/morning

# Probar notificación vespertina
POST /api/test/notifications/evening
```

ejemplo

```bash
curl -X POST http://localhost:4000/api/test/notifications/
evening
```

## Contenido de los Emails

### 9:00 AM - Recordatorio Matutino

- **Asunto**: "Hoy es un día perfecto para aprender 🚀"
- **Mensaje**: Motivacional con link directo a la trivia

### 6:00 PM - Recordatorio Vespertino

- **Asunto**: "Aún estás a tiempo ⏳"
- **Mensaje**: Urgencia amigable para mantener la racha

## Flujo de Funcionamiento

1. **9:00 AM**: El sistema busca usuarios con `has_done_today = false` y les envía el recordatorio matutino
2. **Durante el día**: Cuando un usuario completa la trivia, se actualiza:
   - `has_done_today = true`
   - `streak += 1` (si no había completado hoy)
   - `magento_points += 10`
3. **6:00 PM**: El sistema vuelve a buscar usuarios con `has_done_today = false` y les envía el recordatorio vespertino
4. **12:00 AM**: Se resetea `has_done_today = false` para todos los usuarios

## Logging y Monitoreo

Todas las notificaciones se registran en la tabla `notification_log` con:

- Timestamp de envío
- Canal (email)
- Template usado
- Metadata adicional

## Instalación y Puesta en Marcha

```bash
# Instalar dependencias
cd server
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones de BD
npm run mig:run

# Iniciar servidor
npm run dev
```

## Desarrollo y Testing

Para probar las notificaciones sin esperar a las horas programadas:

```bash
# Probar notificación matutina
curl -X POST http://localhost:4000/api/test/notifications/morning

# Probar notificación vespertina
git 
```

## Seguridad y Buenas Prácticas

- Las credenciales de email están en variables de entorno
- Los cron jobs usan la zona horaria correcta de Colombia
- Se registra cada notificación enviada para auditoría
- Los endpoints de testing deberían protegerse en producción

## Monitoreo de Producción

Revisa regularmente:

- Logs del servidor para errores de envío
- Tabla `notification_log` para estadísticas de envío
- Tabla `user_progress` para tendencias de engagement

## Personalización

Para modificar los horarios de envío, edita los cron expressions en `NotificationService.ts`:

- `'0 14 * * *'` = 9:00 AM Colombia (14:00 UTC)
- `'0 23 * * *'` = 6:00 PM Colombia (23:00 UTC)
- `'0 5 * * *'` = 12:00 AM Colombia (05:00 UTC siguiente día)

## Notificaciones de Mission Deadline

Sistema adicional que envía recordatorios para misiones próximas a vencer.

### Características

- **Horario**: 2:00 PM Colombia (19:00 UTC) diariamente
- **Criterio**: Misiones que vencen en menos de 24 horas y no están completadas
- **Contenido personalizado** según tiempo restante y progreso actual
- **Niveles de urgencia**: 🚨 Urgente (<6h), ⚠️ Atención (<24h), ⏰ Recordatorio

### Estructura del Email

- **Asunto**: `⏰ Tu misión "[Nombre]" vence pronto`
- **Tiempo restante**: Calculado dinámicamente
- **Progreso actual**: Mensaje motivacional según % completado
- **Link directo**: Botón hacia `/missions`

### Testing

```bash
# Probar notificaciones de deadline
curl -X POST http://localhost:4000/api/test/notifications/mission-deadline
```

### Configuración del Cron Job

- `'0 19 * * *'` = 2:00 PM Colombia (19:00 UTC)
