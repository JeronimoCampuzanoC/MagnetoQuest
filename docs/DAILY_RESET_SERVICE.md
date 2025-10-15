# Daily Reset Service - Sistema de Racha (Streak)

## 📋 Descripción

El `DailyResetService` es un servicio automatizado que se ejecuta **todos los días a medianoche** para gestionar el sistema de rachas (streaks) de usuarios en MagnetoQuest.

## 🎯 Funcionalidad

### Proceso Automático (00:00 cada día)

1. **Resetear Streaks Perdidos** ❌

   - Si un usuario tiene `has_done_today = false` (no completó su trivia ayer)
   - Y tiene `streak > 0` (tenía una racha activa)
   - Entonces: `streak = 0` (pierde su racha)

2. **Resetear Contador Diario** 🔄

   - Para **TODOS** los usuarios
   - `has_done_today = false` (nuevo día, nadie ha completado su trivia aún)
   - `updated_at = NOW()` (actualizar timestamp)

3. **Mostrar Estadísticas** 📊
   - Total de usuarios que perdieron su racha
   - Total de usuarios reseteados
   - Estadísticas de streaks activos (max, promedio)

## 🚀 Uso

### Inicio Automático

El servicio se inicia automáticamente cuando el servidor arranca:

```typescript
// En server/src/index.ts
AppDataSource.initialize().then(() => {
  console.log("✅ TypeORM conectado");
  dailyResetService.start(); // ✅ Se inicia automáticamente
  app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
});
```

### Ejecución Manual (Testing/Debugging)

```bash
# Ejecutar el reset diario manualmente
curl -X POST http://localhost:4000/api/admin/daily-reset/execute
```

### Verificar Estado del Servicio

```bash
# Obtener estado del servicio
curl http://localhost:4000/api/admin/daily-reset/status
```

Respuesta:

```json
{
  "isRunning": true,
  "nextExecution": "Todos los días a las 00:00",
  "serverTime": "2025-10-14T15:30:00.000Z",
  "timezone": "America/Bogota"
}
```

## 📊 Ejemplo de Flujo

### Día 1 (Usuario completa trivia)

```
Usuario: Juan
streak: 0 → 1
has_done_today: false → true
magento_points: 0 → 10
```

### Día 2 a las 00:00 (Reset automático)

```
Usuario: Juan
streak: 1 (se mantiene, porque has_done_today era true)
has_done_today: true → false
```

### Día 2 (Usuario completa trivia)

```
Usuario: Juan
streak: 1 → 2
has_done_today: false → true
magento_points: 10 → 20
```

### Día 3 a las 00:00 (Reset automático - Usuario NO hizo trivia)

```
Usuario: Juan
streak: 2 → 0 ❌ (PIERDE LA RACHA porque has_done_today era false)
has_done_today: false → false
```

## 🔧 Configuración

### Zona Horaria

El servicio usa `America/Bogota` por defecto. Para cambiarla, edita:

```typescript
// server/src/services/DailyResetService.ts
this.cronJob = cron.schedule(
  "0 0 * * *",
  async () => {
    await this.performDailyReset();
  },
  {
    timezone: "America/Bogota", // Cambia aquí tu zona horaria
  }
);
```

Zonas horarias comunes:

- `America/New_York` - EST/EDT
- `America/Los_Angeles` - PST/PDT
- `America/Mexico_City` - CST
- `America/Bogota` - COT (no cambia con horario de verano)
- `Europe/Madrid` - CET/CEST
- `UTC` - Tiempo universal

### Horario de Ejecución

Actualmente configurado para **00:00** (medianoche). Para cambiar:

```typescript
// Formato cron: minuto hora dia mes dia-semana
"0 0 * * *"; // 00:00 todos los días (ACTUAL)
"0 1 * * *"; // 01:00 todos los días
"30 23 * * *"; // 23:30 todos los días
```

## 📝 Logs del Sistema

### Logs de Inicio

```
✅ [DailyResetService] Servicio iniciado - Se ejecutará todos los días a medianoche
🕐 [DailyResetService] Zona horaria: America/Bogota
```

### Logs de Ejecución

```
🌅 [DailyResetService] ====== INICIANDO RESET DIARIO ======
🕐 [DailyResetService] Hora: 2025-10-14T05:00:00.000Z
❌ [DailyResetService] Streaks reseteados: 3 usuarios perdieron su racha
🔄 [DailyResetService] has_done_today reseteado: 10 usuarios
📊 [DailyResetService] Estadísticas de streaks activos:
   - Total usuarios con streak activo: 7
   - Streak máximo: 12 días
   - Streak promedio: 5 días
✅ [DailyResetService] ====== RESET DIARIO COMPLETADO ======
```

## 🛠️ Endpoints de Administración

### 1. Ejecutar Reset Manual

```http
POST /api/admin/daily-reset/execute
```

**Respuesta:**

```json
{
  "message": "Reset diario ejecutado correctamente",
  "timestamp": "2025-10-14T15:30:00.000Z"
}
```

### 2. Estado del Servicio

```http
GET /api/admin/daily-reset/status
```

**Respuesta:**

```json
{
  "isRunning": true,
  "nextExecution": "Todos los días a las 00:00",
  "serverTime": "2025-10-14T15:30:00.000Z",
  "timezone": "America/Bogota"
}
```

## 🧪 Testing

### Probar el Reset Manualmente

```bash
# Terminal 1: Ver los logs del servidor
npm run dev

# Terminal 2: Ejecutar el reset
curl -X POST http://localhost:4000/api/admin/daily-reset/execute
```

### Verificar Base de Datos

```sql
-- Ver usuarios que perderían su racha
SELECT user_id, streak, has_done_today, updated_at
FROM user_progress
WHERE has_done_today = false AND streak > 0;

-- Ver todos los usuarios y su progreso
SELECT u.name, up.streak, up.has_done_today, up.magento_points
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
ORDER BY up.streak DESC;
```

## ⚠️ Consideraciones Importantes

1. **El servidor debe estar corriendo 24/7** para que el cron funcione
2. Si el servidor se reinicia, el servicio se reinicia automáticamente
3. Si el servidor está apagado a medianoche, **el reset NO se ejecutará**
4. Para producción, considera usar servicios externos como:
   - AWS CloudWatch Events
   - Google Cloud Scheduler
   - Heroku Scheduler
   - GitHub Actions (con workflows programados)

## 🔐 Seguridad

Los endpoints de administración (`/api/admin/*`) deberían estar protegidos con autenticación en producción:

```typescript
// Ejemplo de middleware de autenticación
app.post(
  "/api/admin/daily-reset/execute",
  authenticateAdmin,
  async (req, res) => {
    // ... código del endpoint
  }
);
```

## 📚 Referencias

- [node-cron Documentation](https://github.com/node-cron/node-cron)
- [Cron Expression Generator](https://crontab.guru/)
- [TypeORM Documentation](https://typeorm.io/)
