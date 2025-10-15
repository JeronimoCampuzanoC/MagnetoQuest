# 🎯 Sistema de Progreso de Misiones - Resumen de Implementación

## ✅ Implementación Completada

Se ha implementado exitosamente el **Sistema Automático de Progreso de Misiones** que actualiza el avance del usuario cuando realiza acciones específicas en la plataforma.

## 🎮 Funcionalidades Implementadas

### 1. Actualización Automática de Misiones de Certificados ✨

**Endpoint:** `POST /api/certificates`

Cuando el usuario agrega un certificado:

- ✅ Busca todas las misiones activas de tipo "Certificate"
- ✅ Incrementa el progreso (`progress + 1`) de cada misión
- ✅ Verifica si se completó la misión (`progress >= objective`)
- ✅ Si se completa: marca `status = 'completed'` y otorga recompensa (XP)
- ✅ Actualiza `magento_points` del usuario con el XP de la misión

**Logs generados:**

```
📋 [Certificates] Encontradas X misiones de tipo Certificate activas
➕ [Certificates] Progreso de misión "Título": X/Y
🏆 [Certificates] ¡Misión "Título" completada!
💰 [Certificates] +X puntos otorgados. Total: Y
✅ [Certificates] Progreso de misiones actualizado para usuario
```

### 2. Actualización Automática de Misiones de Proyectos ✨

**Endpoint:** `POST /api/projects`

Cuando el usuario agrega un proyecto:

- ✅ Busca todas las misiones activas de tipo "Project"
- ✅ Incrementa el progreso (`progress + 1`) de cada misión
- ✅ Verifica si se completó la misión (`progress >= objective`)
- ✅ Si se completa: marca `status = 'completed'` y otorga recompensa (XP)
- ✅ Actualiza `magento_points` del usuario con el XP de la misión

**Logs generados:**

```
📂 [Projects] Encontradas X misiones de tipo Project activas
➕ [Projects] Progreso de misión "Título": X/Y
🏆 [Projects] ¡Misión "Título" completada!
💰 [Projects] +X puntos otorgados. Total: Y
✅ [Projects] Progreso de misiones actualizado para usuario
```

### 3. Sistema de Misiones de Trivia (Ya existente) ✅

**Endpoint:** `POST /api/trivia-attempts`

Ya estaba implementado el sistema de badges para trivias, que funciona de manera similar.

## 🔄 Flujo Completo

```
Usuario realiza acción (Certificado/Proyecto/Trivia)
    ↓
Backend: Guardar en DB
    ↓
Backend: Buscar misiones activas del tipo correspondiente
    ↓
Para cada misión:
    ↓
    ¿Existe user_mission_progress?
    ├─ NO  → Crear registro con progress = 0
    └─ SÍ  → Usar registro existente
    ↓
    ¿Misión completada? (status = 'completed')
    ├─ SÍ  → No hacer nada
    └─ NO  → Incrementar progress + 1
    ↓
    ¿progress >= objective?
    ├─ SÍ  → Completar misión:
    │        - status = 'completed'
    │        - completed_at = NOW()
    │        - Otorgar XP → magento_points
    │        - Logs: 🏆 Misión completada + 💰 Puntos
    └─ NO  → Actualizar progreso:
             - status = 'in_progress'
             - Logs: ➕ Progreso actualizado
    ↓
Backend: Retornar recurso creado
```

## 📊 Ejemplo de Uso

### Escenario: Usuario completa misión de 3 certificados

#### Estado Inicial

```sql
-- Misión
mission_id | title            | category    | objective | xp_reward
-----------|------------------|-------------|-----------|----------
abc-123    | Consigue 3 certs | Certificate | 3         | 40

-- Usuario no tiene progreso aún
SELECT * FROM user_mission_progress WHERE user_id = 'user-123';
-- (vacío)

-- Puntos del usuario
magento_points: 150
```

#### Acción 1: Crear Certificado 1

```bash
POST /api/certificates
{ "name": "Cert React", "userId": "user-123" }
```

**Resultado:**

```sql
-- user_mission_progress
user_id  | mission_id | status      | progress | completed_at
---------|------------|-------------|----------|-------------
user-123 | abc-123    | in_progress | 1        | NULL

-- user_progress
magento_points: 150 (sin cambios)
```

#### Acción 2: Crear Certificado 2

```bash
POST /api/certificates
{ "name": "Cert Node", "userId": "user-123" }
```

**Resultado:**

```sql
-- user_mission_progress
user_id  | mission_id | status      | progress | completed_at
---------|------------|-------------|----------|-------------
user-123 | abc-123    | in_progress | 2        | NULL

-- user_progress
magento_points: 150 (sin cambios)
```

#### Acción 3: Crear Certificado 3 ✅ COMPLETA MISIÓN

```bash
POST /api/certificates
{ "name": "Cert TypeScript", "userId": "user-123" }
```

**Resultado:**

```sql
-- user_mission_progress
user_id  | mission_id | status    | progress | completed_at
---------|------------|-----------|----------|-------------------
user-123 | abc-123    | completed | 3        | 2025-10-14 15:30:00

-- user_progress
magento_points: 190 (150 + 40) ✅ +40 puntos!
```

## 🎁 Sistema de Recompensas

### Cuando se completa una misión:

1. ✅ Se marca como completada (`status = 'completed'`)
2. ✅ Se registra la fecha (`completed_at = NOW()`)
3. ✅ Se otorgan los puntos de recompensa (`magento_points += xp_reward`)
4. ✅ Se generan logs de celebración 🏆💰

### Puntos de Recompensa (XP)

```sql
-- Ejemplos del schema
'Sube un proyecto'     → 15 XP
'Primer Cert'          → 15 XP
'Consigue 3 certs'     → 40 XP
'Responde 5 trivias'   → 30 XP
'Portfolio'            → 35 XP
'CI/CD básico'         → 50 XP
```

## 📝 Archivos Modificados/Creados

### Archivos Modificados

```
📝 server/src/index.ts
   ├─ POST /api/certificates  (líneas 523-634) - Lógica de actualización de misiones
   └─ POST /api/projects      (líneas 375-487) - Lógica de actualización de misiones
```

### Archivos Creados

```
✨ docs/MISSION_PROGRESS_SYSTEM.md    - Documentación completa del sistema
✨ server/test-mission-progress.sh    - Script de testing automatizado
📝 server/README.md                    - Actualizado con info del sistema
```

## 🧪 Testing

### Script Automatizado

```bash
cd server
chmod +x test-mission-progress.sh
./test-mission-progress.sh
```

### Testing Manual

```bash
# 1. Crear certificado
curl -X POST http://localhost:4000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Cert", "description": "Testing", "userId": "user-id"}'

# 2. Ver progreso
docker exec -it poc-postgres psql -U poc_user -d poc_db -c \
  "SELECT m.title, ump.progress, m.objective, ump.status
   FROM user_mission_progress ump
   JOIN mission m ON m.mission_id = ump.mission_id
   WHERE ump.user_id = 'user-id';"
```

## 🔍 Queries Útiles

### Ver progreso de misiones de un usuario

```sql
SELECT
  m.title,
  m.category,
  ump.status,
  CONCAT(ump.progress, '/', m.objective) as progress,
  m.xp_reward
FROM user_mission_progress ump
JOIN mission m ON m.mission_id = ump.mission_id
WHERE ump.user_id = 'user-123'
ORDER BY m.category, m.created_at;
```

### Ver misiones completadas

```sql
SELECT
  m.title,
  m.category,
  ump.completed_at,
  m.xp_reward
FROM user_mission_progress ump
JOIN mission m ON m.mission_id = ump.mission_id
WHERE ump.user_id = 'user-123'
  AND ump.status = 'completed'
ORDER BY ump.completed_at DESC;
```

### Ver total de XP ganado

```sql
SELECT
  COUNT(*) as missions_completed,
  SUM(m.xp_reward) as total_xp_earned,
  up.magento_points as current_points
FROM user_mission_progress ump
JOIN mission m ON m.mission_id = ump.mission_id
JOIN user_progress up ON up.user_id = ump.user_id
WHERE ump.user_id = 'user-123'
  AND ump.status = 'completed'
GROUP BY up.magento_points;
```

## ⚙️ Configuración

### Crear nueva misión

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active)
VALUES (
  'Tu Misión',
  'Descripción',
  'Certificate',  -- o 'Project', 'Trivia', 'CV'
  50,             -- Puntos de recompensa
  5,              -- Cantidad objetivo
  TRUE            -- Activa
);
```

### Desactivar misión

```sql
UPDATE mission
SET is_active = FALSE
WHERE mission_id = 'mission-id';
```

## 🚨 Consideraciones Importantes

1. ✅ **Misiones Activas**: Solo se actualizan misiones con `is_active = TRUE`
2. ✅ **No Duplicados**: Una vez completada (`status = 'completed'`), no se actualiza más
3. ✅ **Creación Automática**: Si el usuario no tiene progreso, se crea automáticamente
4. ✅ **Recompensas Únicas**: XP solo se otorga al completar, no por cada incremento
5. ✅ **Transacciones Seguras**: Si hay error, no falla la creación del recurso principal
6. ✅ **Múltiples Misiones**: Un usuario puede tener varias misiones del mismo tipo activas

## 📈 Métricas de Éxito

### Lo que se logró:

- ✅ Sistema completamente funcional
- ✅ Actualización automática de progreso
- ✅ Otorgamiento automático de recompensas
- ✅ Logs detallados para debugging
- ✅ Manejo de errores sin afectar funcionalidad principal
- ✅ Documentación completa
- ✅ Scripts de testing
- ✅ Soporte para múltiples misiones simultáneas

## 🎉 Resultado Final

### Sistema Completo de Gamificación:

```
✅ Streaks (rachas diarias)
✅ Badges (insignias por logros)
✅ Missions (misiones con objetivos)
✅ Points (puntos de experiencia)
✅ Progress Tracking (seguimiento de progreso)
✅ Rewards (recompensas automáticas)
```

### Flujo de Usuario:

```
Usuario → Acción (Cert/Proyecto/Trivia)
    ↓
Sistema actualiza:
    ├─ Progress de misiones
    ├─ Badges
    ├─ Puntos (magento_points)
    └─ Streaks (si es trivia)
    ↓
Usuario ve:
    ├─ 🏆 Misión completada
    ├─ 💰 Puntos ganados
    └─ 🔥 Progreso actualizado
```

## 📞 Referencias

- **Documentación:** [`/docs/MISSION_PROGRESS_SYSTEM.md`](../docs/MISSION_PROGRESS_SYSTEM.md)
- **Testing:** [`/server/test-mission-progress.sh`](../server/test-mission-progress.sh)
- **Server README:** [`/server/README.md`](../server/README.md)
- **Schema SQL:** [`/db/initdb/schema.sql`](../db/initdb/schema.sql)
