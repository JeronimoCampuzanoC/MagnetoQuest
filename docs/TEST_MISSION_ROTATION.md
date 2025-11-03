# Test de Rotación Automática de Misiones

Este documento explica cómo probar el sistema de rotación automática de misiones implementado en `MissionDelegate`.

## 📋 Resumen del Sistema

El servicio `MissionDelegate` se ejecuta automáticamente cada noche a las **00:00 (medianoche)** en zona horaria de Bogotá y:

1. ✅ Encuentra todas las misiones expiradas (`ends_at < NOW()`)
2. 🗑️ Elimina las misiones expiradas de `user_mission_progress`
3. 🎲 Asigna nuevas misiones aleatorias del mismo tipo de frecuencia
4. ⏰ Calcula las nuevas fechas de vencimiento según el tipo:
   - **Daily**: Hasta final del día (23:59:59)
   - **Flash**: 6 horas desde el momento de asignación
   - **Weekly**: 7 días (23:59:59)
   - **Monthly**: 30 días (23:59:59)

## 🚀 Cómo Probar

### 1. Verificar Estado del Servicio

```bash
curl http://localhost:4000/api/admin/mission-rotation/status
```

**Respuesta esperada:**
```json
{
  "status": "running",
  "service": "MissionDelegate",
  "schedule": "0 0 * * * (midnight Bogota time)"
}
```

### 2. Crear Misiones de Prueba con Fechas Expiradas

Conectarse a la base de datos y ejecutar:

```sql
-- Verificar misiones actuales del usuario
SELECT ump.*, m.title, m.frequency, m.category
FROM user_mission_progress ump
JOIN mission m ON ump.mission_id = m.mission_id
WHERE ump.user_id = 'tu_user_id_aqui';

-- Actualizar algunas misiones para que ya estén vencidas (para testing)
UPDATE user_mission_progress
SET ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'tu_user_id_aqui' 
  AND mission_id IN (
    SELECT mission_id FROM mission WHERE frequency = 'daily' LIMIT 1
  );

-- Verificar que se actualizaron
SELECT ump.*, m.title, m.frequency, m.category, 
       CASE WHEN ump.ends_at < NOW() THEN 'EXPIRADA' ELSE 'VIGENTE' END as estado
FROM user_mission_progress ump
JOIN mission m ON ump.mission_id = m.mission_id
WHERE ump.user_id = 'tu_user_id_aqui';
```

### 3. Ejecutar Rotación Manual (sin esperar a medianoche)

```bash
curl -X POST http://localhost:4000/api/admin/mission-rotation/execute
```

**Respuesta esperada:**
```json
{
  "message": "Mission rotation executed successfully",
  "timestamp": "2025-01-15T12:34:56.789Z"
}
```

### 4. Verificar los Cambios en la Base de Datos

```sql
-- Ver las misiones actuales después de la rotación
SELECT ump.*, m.title, m.frequency, m.category,
       CASE WHEN ump.ends_at < NOW() THEN 'EXPIRADA' ELSE 'VIGENTE' END as estado
FROM user_mission_progress ump
JOIN mission m ON ump.mission_id = m.mission_id
WHERE ump.user_id = 'tu_user_id_aqui'
ORDER BY m.frequency, ump.assigned_at DESC;
```

**Verificaciones:**
- ✅ Las misiones expiradas fueron eliminadas
- ✅ Nuevas misiones fueron asignadas con el mismo `frequency`
- ✅ Cada usuario mantiene el mismo número de misiones
- ✅ Las fechas `ends_at` están correctamente calculadas
- ✅ No hay misiones duplicadas para un mismo usuario

## 🔍 Logs del Servidor

Al ejecutar la rotación, deberías ver logs como estos en la consola del servidor:

```
🔧 [Admin] Ejecutando rotación de misiones manualmente...
🔄 [MissionDelegate] Iniciando barrido nocturno de misiones...
🔄 [MissionDelegate] Se encontraron 3 misiones vencidas en total
📦 [MissionDelegate] Usuario user123: se eliminaron 2 misiones con frecuencia 'daily'
📦 [MissionDelegate] Usuario user123: se eliminaron 1 misiones con frecuencia 'weekly'
🎯 [MissionDelegate] Asignando 2 misiones aleatorias con frecuencia 'daily' a usuario user123
🎯 [MissionDelegate] Asignando 1 misiones aleatorias con frecuencia 'weekly' a usuario user123
✅ [MissionDelegate] Barrido nocturno completado exitosamente
```

## 📊 Estructura de Frecuencias

Según el schema actual, hay **10 misiones** distribuidas así:

| Frecuencia | Cantidad | IDs |
|-----------|----------|-----|
| **Daily** | 2 misiones | 1, 2 |
| **Flash** | 2 misiones | 3, 4 |
| **Weekly** | 3 misiones | 5, 6, 7 |
| **Monthly** | 3 misiones | 8, 9, 10 |

## 🛠️ Troubleshooting

### El servicio no arranca

Verificar que el servidor haya inicializado correctamente:
```bash
# En los logs del servidor deberías ver:
✅ TypeORM conectado
🔄 [DailyReset] Servicio iniciado. Cron programado para las 02:00 y 18:00 Bogotá.
🎯 [MissionDelegate] Servicio de rotación de misiones iniciado
API http://localhost:4000
```

### Las misiones no se rotan

1. Verificar que realmente haya misiones expiradas
2. Revisar los logs del servidor para ver errores
3. Ejecutar manualmente: `POST /api/admin/mission-rotation/execute`

### Error de TypeORM

Si hay problemas con las entidades:
```bash
cd server
npm run build
```

## 🔐 Seguridad (Producción)

**IMPORTANTE:** Los endpoints `/api/admin/*` deberían estar protegidos con autenticación en producción:

```typescript
// Agregar middleware de autenticación
app.post('/api/admin/mission-rotation/execute', requireAdmin, async (_req, res) => {
  // ...
});
```

## 📝 Notas Técnicas

- El servicio usa `node-cron` con timezone `America/Bogota`
- Es un singleton, solo hay una instancia ejecutándose
- El cron job se detiene automáticamente cuando se cierra el servidor
- Las misiones se asignan aleatoriamente usando `Math.random()`
- No se asignan misiones duplicadas a un mismo usuario
- La lógica de expiración se basa en comparar `ends_at < NOW()`

## 🎯 Próximas Mejoras

Posibles mejoras futuras:
- [ ] Notificaciones cuando se asignan nuevas misiones
- [ ] Historial de rotaciones en base de datos
- [ ] Dashboard admin para visualizar estadísticas de rotación
- [ ] Sistema de pesos para priorizar ciertas misiones
- [ ] Limitar rotaciones por usuario (ej: máximo 3 rotaciones por día)
