# Ejemplos de Uso - Daily Reset Service

## 📘 Escenarios de Uso

### Escenario 1: Usuario Mantiene su Racha

**Estado Inicial (Día 1 - 14:00)**

```sql
SELECT * FROM user_progress WHERE user_id = 'user-123';
```

```
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-123  | 5      | false          | 150
```

**Usuario Completa Trivia (Día 1 - 16:00)**

```bash
curl -X PUT http://localhost:4000/api/users/user-123/progress/trivia-completed
```

**Resultado:**

```sql
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-123  | 6      | true           | 160  ✅ +1 streak, +10 puntos
```

**Reset Automático (Día 2 - 00:00)**

```
🌅 [DailyResetService] ====== INICIANDO RESET DIARIO ======
❌ [DailyResetService] Streaks reseteados: 0 usuarios
🔄 [DailyResetService] has_done_today reseteado: 10 usuarios
```

**Estado Después del Reset (Día 2 - 00:01)**

```sql
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-123  | 6      | false          | 160  ✅ Mantiene streak
```

---

### Escenario 2: Usuario Pierde su Racha

**Estado Inicial (Día 1 - 14:00)**

```sql
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-456  | 10     | false          | 300
```

**Usuario NO Completa Trivia (Día 1)**
❌ No hace nada

**Reset Automático (Día 2 - 00:00)**

```
🌅 [DailyResetService] ====== INICIANDO RESET DIARIO ======
❌ [DailyResetService] Streaks reseteados: 1 usuarios perdieron su racha
🔄 [DailyResetService] has_done_today reseteado: 10 usuarios
```

**Estado Después del Reset (Día 2 - 00:01)**

```sql
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-456  | 0      | false          | 300  ❌ Pierde streak
```

---

### Escenario 3: Usuario Nuevo (Primera Trivia)

**Estado Inicial (Día 1 - 14:00)**

```sql
-- No existe registro de user_progress
```

**Usuario Completa Primera Trivia (Día 1 - 16:00)**

```bash
curl -X PUT http://localhost:4000/api/users/user-789/progress/trivia-completed
```

**Resultado (Se crea automáticamente):**

```sql
user_id   | streak | has_done_today | magento_points
----------|--------|----------------|---------------
user-789  | 1      | true           | 10  ✅ Primera racha
```

---

## 🧪 Testing Manual

### Preparación

```bash
# Terminal 1: Iniciar servidor
cd server
npm run dev

# Terminal 2: Preparar usuarios de prueba
docker exec -it poc-postgres psql -U poc_user -d poc_db
```

### Test 1: Simular Usuario que Mantiene Racha

```sql
-- 1. Configurar usuario con racha activa y trivia completada
UPDATE user_progress
SET streak = 5, has_done_today = true, magento_points = 100
WHERE user_id = (SELECT id_app_user FROM app_user LIMIT 1);

-- 2. Ver estado actual
SELECT u.name, up.*
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
LIMIT 1;
```

```bash
# 3. Ejecutar reset manual
curl -X POST http://localhost:4000/api/admin/daily-reset/execute

# 4. Verificar que mantuvo el streak
docker exec -it poc-postgres psql -U poc_user -d poc_db -c "SELECT u.name, up.streak, up.has_done_today FROM user_progress up JOIN app_user u ON u.id_app_user = up.user_id LIMIT 1;"
```

**Resultado Esperado:**

- ✅ `streak`: 5 (se mantiene)
- ✅ `has_done_today`: false (reseteado)

---

### Test 2: Simular Usuario que Pierde Racha

```sql
-- 1. Configurar usuario con racha activa pero SIN completar trivia
UPDATE user_progress
SET streak = 7, has_done_today = false, magento_points = 150
WHERE user_id = (SELECT id_app_user FROM app_user LIMIT 1 OFFSET 1);

-- 2. Ver estado actual
SELECT u.name, up.*
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
OFFSET 1 LIMIT 1;
```

```bash
# 3. Ejecutar reset manual
curl -X POST http://localhost:4000/api/admin/daily-reset/execute

# 4. Verificar que perdió el streak
docker exec -it poc-postgres psql -U poc_user -d poc_db -c "SELECT u.name, up.streak, up.has_done_today FROM user_progress up JOIN app_user u ON u.id_app_user = up.user_id OFFSET 1 LIMIT 1;"
```

**Resultado Esperado:**

- ❌ `streak`: 0 (perdió racha)
- ✅ `has_done_today`: false (reseteado)

---

### Test 3: Verificar Reset Completo

```bash
# Ejecutar script de testing completo
cd server
./test-daily-reset.sh
```

**Output Esperado:**

```
======================================
🧪 Testing Daily Reset Service
======================================

1. Verificando estado del servicio...
{
  "isRunning": true,
  "nextExecution": "Todos los días a las 00:00",
  "serverTime": "2025-10-14T15:30:00.000Z",
  "timezone": "America/Bogota"
}

2. Progreso de usuarios ANTES del reset:
 name          | streak | has_done_today | magento_points
---------------|--------|----------------|----------------
 Carlos Díaz   |     12 | t              |            350
 María Gómez   |      8 | t              |            220
 Ana Torres    |      5 | t              |            150
 ...

3. Ejecutando reset diario manualmente...
{
  "message": "Reset diario ejecutado correctamente",
  "timestamp": "2025-10-14T15:30:00.000Z"
}

4. Progreso de usuarios DESPUÉS del reset:
 name          | streak | has_done_today | magento_points
---------------|--------|----------------|----------------
 Carlos Díaz   |     12 | f              |            350
 María Gómez   |      8 | f              |            220
 Ana Torres    |      5 | f              |            150
 ...

✅ Test completado
======================================
```

---

## 🔍 Queries Útiles de Monitoreo

### Ver Usuarios en Riesgo de Perder Racha

```sql
SELECT
  u.name,
  u.email,
  up.streak,
  up.has_done_today,
  up.updated_at,
  CASE
    WHEN up.has_done_today = false AND up.streak > 0
    THEN '⚠️  PERDERÁ RACHA'
    ELSE '✅ Seguro'
  END as status
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
WHERE up.streak > 0
ORDER BY up.streak DESC;
```

### Estadísticas de Streaks

```sql
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE streak > 0) as users_with_streak,
  COUNT(*) FILTER (WHERE has_done_today = true) as completed_today,
  MAX(streak) as max_streak,
  ROUND(AVG(streak), 2) as avg_streak
FROM user_progress;
```

### Historial de Actividad (últimos 7 días)

```sql
SELECT
  DATE(ta.attempted_at) as date,
  COUNT(DISTINCT ta.user_id) as unique_users,
  COUNT(*) as total_attempts,
  ROUND(AVG(ta.score), 2) as avg_score
FROM trivia_attempt ta
WHERE ta.attempted_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(ta.attempted_at)
ORDER BY date DESC;
```

---

## 📊 Monitoreo en Producción

### Health Check

```bash
# Verificar que el servicio está corriendo
curl http://localhost:4000/api/admin/daily-reset/status

# Esperado: { "isRunning": true, ... }
```

### Logs a Revisar

```bash
# Ver logs del servidor
tail -f server.log | grep DailyResetService

# Buscar errores
grep "ERROR.*DailyResetService" server.log
```

### Alertas Recomendadas

1. **Servicio no está corriendo**

   ```bash
   if [ "$(curl -s http://localhost:4000/api/admin/daily-reset/status | jq -r '.isRunning')" != "true" ]; then
     echo "⚠️  ALERTA: Daily Reset Service no está corriendo"
   fi
   ```

2. **Reset no ejecutado en 25 horas**

   ```sql
   SELECT
     MAX(updated_at) as last_reset,
     NOW() - MAX(updated_at) as time_since_reset
   FROM user_progress;

   -- Si time_since_reset > 25 hours → ALERTA
   ```

---

## 🚨 Troubleshooting

### Problema: El cron no se ejecuta

**Síntomas:**

- El servidor está corriendo pero el reset no se ejecuta a medianoche
- `isRunning: false` en el status

**Solución:**

```bash
# 1. Reiniciar el servidor
npm run dev

# 2. Verificar logs
# Debe aparecer: "✅ [DailyResetService] Servicio iniciado"

# 3. Verificar estado
curl http://localhost:4000/api/admin/daily-reset/status
```

### Problema: Zona horaria incorrecta

**Síntomas:**

- El reset se ejecuta a una hora diferente a la esperada

**Solución:**

```typescript
// En server/src/services/DailyResetService.ts
timezone: "America/Bogota"; // Cambiar a tu zona horaria correcta
```

### Problema: Usuarios no pierden streak cuando deberían

**Diagnóstico:**

```sql
-- Ver usuarios que deberían perder racha
SELECT u.name, up.streak, up.has_done_today, up.updated_at
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
WHERE up.has_done_today = false AND up.streak > 0;
```

**Solución:**

```bash
# Ejecutar reset manualmente
curl -X POST http://localhost:4000/api/admin/daily-reset/execute
```
