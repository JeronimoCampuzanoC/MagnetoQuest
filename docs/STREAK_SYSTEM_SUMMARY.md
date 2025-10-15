# 🎯 Sistema de Racha (Streak) - Resumen de Implementación

## ✅ Lo que se ha implementado

### 1. Servicio Automático de Reset Diario ⏰

**Archivo:** `server/src/services/DailyResetService.ts`

- ✅ Se ejecuta automáticamente todos los días a **00:00** (medianoche)
- ✅ Usa **node-cron** para programación de tareas
- ✅ Resetea `streak = 0` si `has_done_today = false`
- ✅ Resetea `has_done_today = false` para todos los usuarios
- ✅ Genera logs detallados de la operación
- ✅ Muestra estadísticas de streaks activos

### 2. Integración con el Servidor 🔌

**Archivo:** `server/src/index.ts`

- ✅ Se inicia automáticamente cuando arranca el servidor
- ✅ Funciona en background sin interrumpir otras operaciones

### 3. Endpoints de Administración 🛠️

**Nuevos endpoints:**

```bash
# Ver estado del servicio
GET /api/admin/daily-reset/status

# Ejecutar reset manualmente (testing)
POST /api/admin/daily-reset/execute
```

### 4. Sistema Completo de Streaks 🔥

**Flujo completo implementado:**

```
1. Usuario completa trivia
   ↓
2. Frontend llama: PUT /api/users/:userId/progress/trivia-completed
   ↓
3. Backend actualiza:
   - has_done_today = true
   - streak += 1
   - magento_points += 10
   ↓
4. A medianoche (00:00) - DailyResetService:
   a) Si has_done_today = false → streak = 0 ❌
   b) Todos los usuarios → has_done_today = false 🔄
   ↓
5. Nuevo día comienza → Repetir desde paso 1
```

### 5. Documentación 📚

- ✅ `docs/DAILY_RESET_SERVICE.md` - Documentación completa del servicio
- ✅ `docs/DAILY_RESET_EXAMPLES.md` - Ejemplos y casos de uso
- ✅ `server/README.md` - Guía de uso del servidor
- ✅ `server/test-daily-reset.sh` - Script de testing automatizado

---

## 🎮 Cómo Funciona el Sistema de Racha

### Día 1 - Usuario Activo 👤

**14:00** - Usuario completa trivia

```
streak: 0 → 1
has_done_today: false → true
magento_points: 0 → 10
```

**00:00** - Reset automático

```
streak: 1 (mantiene ✅)
has_done_today: true → false
```

### Día 2 - Usuario Activo 👤

**16:00** - Usuario completa trivia

```
streak: 1 → 2
has_done_today: false → true
magento_points: 10 → 20
```

**00:00** - Reset automático

```
streak: 2 (mantiene ✅)
has_done_today: true → false
```

### Día 3 - Usuario Inactivo 💤

**00:00** - Reset automático (usuario NO hizo trivia ayer)

```
streak: 2 → 0 ❌ (PIERDE RACHA)
has_done_today: false → false
```

---

## 🧪 Testing

### Test Rápido

```bash
# 1. Iniciar servidor
cd server
npm run dev

# 2. Ejecutar script de prueba
./test-daily-reset.sh
```

### Test Manual

```bash
# Ver estado del servicio
curl http://localhost:4000/api/admin/daily-reset/status

# Ejecutar reset manualmente
curl -X POST http://localhost:4000/api/admin/daily-reset/execute

# Ver logs en la consola del servidor
```

---

## 📊 Monitoreo

### Ver Progreso de Usuarios

```sql
SELECT
  u.name,
  up.streak,
  up.has_done_today,
  up.magento_points,
  up.updated_at
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
ORDER BY up.streak DESC;
```

### Ver Usuarios en Riesgo

```sql
SELECT u.name, up.streak, up.has_done_today
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
WHERE up.has_done_today = false AND up.streak > 0;
```

---

## 🔧 Configuración

### Cambiar Zona Horaria

```typescript
// server/src/services/DailyResetService.ts (línea 34)
timezone: "America/Bogota"; // Cambiar aquí
```

Opciones comunes:

- `America/New_York`
- `America/Los_Angeles`
- `America/Mexico_City`
- `Europe/Madrid`
- `UTC`

### Cambiar Hora de Ejecución

```typescript
// server/src/services/DailyResetService.ts (línea 30)
"0 0 * * *"; // 00:00 (medianoche) - ACTUAL
"0 1 * * *"; // 01:00
"30 23 * * *"; // 23:30
```

---

## ⚠️ Consideraciones Importantes

### Para Desarrollo

- ✅ El servidor debe estar corriendo para que el cron funcione
- ✅ Puedes ejecutar el reset manualmente para testing
- ✅ Los logs se muestran en la consola

### Para Producción

- ⚠️ El servidor debe estar corriendo 24/7
- ⚠️ Si el servidor se cae a medianoche, el reset NO se ejecuta
- ⚠️ Considera usar servicios externos (AWS CloudWatch, etc.)
- ⚠️ Protege los endpoints de admin con autenticación
- ⚠️ Implementa monitoreo y alertas

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

```
✨ server/src/services/DailyResetService.ts     (Servicio principal)
✨ server/test-daily-reset.sh                   (Script de testing)
✨ server/README.md                              (Documentación servidor)
✨ docs/DAILY_RESET_SERVICE.md                  (Docs del servicio)
✨ docs/DAILY_RESET_EXAMPLES.md                 (Ejemplos de uso)
```

### Archivos Modificados

```
📝 server/src/index.ts                          (Integración del servicio)
📝 client/src/apps/triviaApp.tsx                (Llamada al endpoint de progreso)
```

---

## 🎉 Resultado Final

### Lo que tienes ahora:

1. ✅ Sistema completo de rachas (streaks)
2. ✅ Actualización automática cuando el usuario completa trivia
3. ✅ Reset automático diario a medianoche
4. ✅ Penalización por inactividad (pérdida de racha)
5. ✅ Sistema de puntos (magento_points)
6. ✅ Logs detallados
7. ✅ Endpoints de administración
8. ✅ Scripts de testing
9. ✅ Documentación completa

### Flujo Completo Funcional:

```
Usuario completa trivia
    ↓
Frontend: triviaApp.tsx
    ↓ (saveTriviaAttempt)
Backend: POST /api/trivia-attempts (guarda intento)
    ↓
Backend: PUT /api/users/:id/progress/trivia-completed
    ↓
    - ✅ has_done_today = true
    - ✅ streak += 1
    - ✅ magento_points += 10
    ↓
[A medianoche - 00:00]
    ↓
DailyResetService (automático)
    ↓
    - ❌ Si has_done_today = false → streak = 0
    - 🔄 Todos → has_done_today = false
    ↓
Nuevo día comienza
```

---

## 🚀 Siguiente Paso

**¡El sistema está listo para usarse!**

```bash
# 1. Reinicia el servidor
cd server
npm run dev

# 2. El servicio se iniciará automáticamente
# Verás en la consola:
# ✅ [DailyResetService] Servicio iniciado - Se ejecutará todos los días a medianoche

# 3. Prueba el sistema
./test-daily-reset.sh
```

---

## 📞 Soporte

Si tienes algún problema:

1. Revisa los logs del servidor
2. Ejecuta el reset manualmente para debugging
3. Consulta `docs/DAILY_RESET_EXAMPLES.md` para troubleshooting
