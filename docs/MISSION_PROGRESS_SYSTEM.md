# Sistema de Progreso de Misiones

## 📋 Descripción

El sistema de progreso de misiones actualiza automáticamente el avance del usuario cuando realiza acciones específicas en la plataforma. Cada tipo de misión se asocia con una acción concreta.

## 🎯 Tipos de Misiones

### 1. Certificate (Certificados)

Se actualiza cuando el usuario agrega un nuevo certificado.

**Endpoint:** `POST /api/certificates`

**Ejemplo de misión:**

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active) VALUES
    ('Consigue 3 certs', 'Agrega 3 certificados', 'Certificate', 40, 3, TRUE);
```

### 2. Project (Proyectos)

Se actualiza cuando el usuario agrega un nuevo proyecto.

**Endpoint:** `POST /api/projects`

**Ejemplo de misión:**

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active) VALUES
    ('Sube un proyecto', 'Publica tu primer proyecto', 'Project', 15, 1, TRUE);
```

### 3. Trivia (Trivias)

Se actualiza cuando el usuario completa una trivia.

**Endpoint:** `POST /api/trivia-attempts`

**Ejemplo de misión:**

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active) VALUES
    ('Responde 5 trivias', 'Practica con trivias', 'Trivia', 30, 5, TRUE);
```

### 4. CV (Curriculum Vitae)

Se actualiza cuando el usuario completa secciones de su perfil.

**Ejemplo de misión:**

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active) VALUES
    ('Completa tu perfil', 'Añade tu información básica', 'CV', 20, 1, TRUE);
```

## 🔄 Flujo de Actualización

### Cuando el usuario agrega un certificado:

```
1. Usuario crea certificado
   ↓
2. POST /api/certificates
   ↓
3. Guardar certificado en DB
   ↓
4. Buscar misiones activas de tipo "Certificate"
   ↓
5. Para cada misión:
   a) Buscar/crear user_mission_progress
   b) Incrementar progress +1
   c) Verificar si progress >= objective
      ↓
      Si SÍ:
      - status = 'completed'
      - completed_at = NOW()
      - Otorgar xp_reward → magento_points
      ↓
      Si NO:
      - status = 'in_progress'
   ↓
6. Guardar user_mission_progress
   ↓
7. Retornar certificado creado
```

## 📊 Ejemplo Completo

### Configuración Inicial

```sql
-- Crear misión
INSERT INTO mission (title, description, category, xp_reward, objective, is_active) VALUES
    ('Consigue 3 certs', 'Agrega 3 certificados', 'Certificate', 40, 3, TRUE);

-- Usuario inicial (sin progreso)
SELECT * FROM user_mission_progress WHERE user_id = 'user-123';
-- (No existe registro)
```

### Usuario Agrega Primer Certificado

```bash
curl -X POST http://localhost:4000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Certificado React",
    "description": "Componentes y Hooks",
    "userId": "user-123"
  }'
```

**Logs del servidor:**

```
📋 [Certificates] Encontradas 1 misiones de tipo Certificate activas
✨ [Certificates] Creando progreso inicial para misión "Consigue 3 certs"
➕ [Certificates] Progreso de misión "Consigue 3 certs": 1/3
✅ [Certificates] Progreso de misiones actualizado para usuario user-123
```

**Estado en DB:**

```sql
SELECT * FROM user_mission_progress WHERE user_id = 'user-123';
```

```
user_id  | mission_id | status      | progress | completed_at
---------|------------|-------------|----------|-------------
user-123 | mission-1  | in_progress | 1        | NULL
```

### Usuario Agrega Segundo Certificado

```bash
curl -X POST http://localhost:4000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Certificado Node.js",
    "description": "APIs y Auth",
    "userId": "user-123"
  }'
```

**Logs del servidor:**

```
📋 [Certificates] Encontradas 1 misiones de tipo Certificate activas
➕ [Certificates] Progreso de misión "Consigue 3 certs": 2/3
✅ [Certificates] Progreso de misiones actualizado para usuario user-123
```

**Estado en DB:**

```
user_id  | mission_id | status      | progress | completed_at
---------|------------|-------------|----------|-------------
user-123 | mission-1  | in_progress | 2        | NULL
```

### Usuario Agrega Tercer Certificado (Completa Misión)

```bash
curl -X POST http://localhost:4000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Certificado TypeScript",
    "description": "Tipos avanzados",
    "userId": "user-123"
  }'
```

**Logs del servidor:**

```
📋 [Certificates] Encontradas 1 misiones de tipo Certificate activas
➕ [Certificates] Progreso de misión "Consigue 3 certs": 3/3
🏆 [Certificates] ¡Misión "Consigue 3 certs" completada!
💰 [Certificates] +40 puntos otorgados. Total: 190
✅ [Certificates] Progreso de misiones actualizado para usuario user-123
```

**Estado en DB:**

```sql
-- user_mission_progress
user_id  | mission_id | status    | progress | completed_at
---------|------------|-----------|----------|-------------------
user-123 | mission-1  | completed | 3        | 2025-10-14 15:30:00

-- user_progress
user_id  | magento_points | updated_at
---------|----------------|-------------------
user-123 | 190            | 2025-10-14 15:30:00
                           (antes era 150)
```

### Usuario Agrega Cuarto Certificado (Ya completó la misión)

```bash
curl -X POST http://localhost:4000/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Certificado AWS",
    "description": "Cloud practitioner",
    "userId": "user-123"
  }'
```

**Logs del servidor:**

```
📋 [Certificates] Encontradas 1 misiones de tipo Certificate activas
✅ [Certificates] Progreso de misiones actualizado para usuario user-123
(No se incrementa porque status = 'completed')
```

**Estado en DB:**

```
user_id  | mission_id | status    | progress | completed_at
---------|------------|-----------|----------|-------------------
user-123 | mission-1  | completed | 3        | 2025-10-14 15:30:00
                                   ↑ No cambia
```

## 🎮 Misiones Múltiples

Un usuario puede tener múltiples misiones del mismo tipo:

```sql
-- Misión 1: Primer certificado
INSERT INTO mission (title, description, category, xp_reward, objective) VALUES
    ('Primer Cert', 'Agrega tu primer certificado', 'Certificate', 15, 1);

-- Misión 2: Tres certificados
INSERT INTO mission (title, description, category, xp_reward, objective) VALUES
    ('Tres Certs', 'Agrega 3 certificados', 'Certificate', 45, 3);

-- Misión 3: Diez certificados
INSERT INTO mission (title, description, category, xp_reward, objective) VALUES
    ('Experto', 'Agrega 10 certificados', 'Certificate', 120, 10);
```

Cuando el usuario agrega un certificado, **todas las misiones activas** de tipo Certificate se actualizan:

```
Usuario agrega 1 certificado
  ↓
Misión "Primer Cert":     0 → 1 ✅ COMPLETADA (+15 pts)
Misión "Tres Certs":      0 → 1 (en progreso)
Misión "Experto":         0 → 1 (en progreso)
```

## 📝 Queries Útiles

### Ver progreso de misiones de un usuario

```sql
SELECT
  m.title,
  m.category,
  ump.status,
  ump.progress,
  m.objective,
  CONCAT(ump.progress, '/', m.objective) as progress_display,
  m.xp_reward
FROM user_mission_progress ump
JOIN mission m ON m.mission_id = ump.mission_id
WHERE ump.user_id = 'user-123'
ORDER BY m.category, m.objective;
```

### Ver misiones completadas de un usuario

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

### Ver total de XP ganado por misiones

```sql
SELECT
  u.name,
  COUNT(*) FILTER (WHERE ump.status = 'completed') as missions_completed,
  SUM(m.xp_reward) FILTER (WHERE ump.status = 'completed') as total_xp_from_missions,
  up.magento_points as total_points
FROM app_user u
LEFT JOIN user_mission_progress ump ON ump.user_id = u.id_app_user
LEFT JOIN mission m ON m.mission_id = ump.mission_id
LEFT JOIN user_progress up ON up.user_id = u.id_app_user
WHERE u.id_app_user = 'user-123'
GROUP BY u.name, up.magento_points;
```

### Ver certificados/proyectos creados por un usuario

```sql
-- Certificados
SELECT COUNT(*) as total_certificates
FROM certificate
WHERE user_id = 'user-123';

-- Proyectos
SELECT COUNT(*) as total_projects
FROM project
WHERE user_id = 'user-123';

-- Trivias
SELECT COUNT(*) as total_trivia_attempts
FROM trivia_attempt
WHERE user_id = 'user-123';
```

## 🏗️ Estructura de Datos

### Tabla: mission

```sql
mission_id      UUID PRIMARY KEY
title           TEXT NOT NULL
description     TEXT
category        mission_category ('Trivia', 'Certificate', 'Project', 'CV')
xp_reward       INT DEFAULT 10
objective       INT DEFAULT 1
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

### Tabla: user_mission_progress

```sql
ump_id          UUID PRIMARY KEY
user_id         UUID REFERENCES app_user
mission_id      UUID REFERENCES mission
status          mission_status ('not_started', 'in_progress', 'completed')
progress        INT DEFAULT 0
starts_at       TIMESTAMPTZ
ends_at         TIMESTAMPTZ
completed_at    TIMESTAMPTZ
```

## 🔧 Configuración

### Crear una nueva misión

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active)
VALUES (
  'Título de la Misión',
  'Descripción detallada',
  'Certificate',  -- o 'Project', 'Trivia', 'CV'
  50,             -- Puntos de recompensa
  5,              -- Cantidad objetivo
  TRUE            -- Activa
);
```

### Desactivar una misión

```sql
UPDATE mission
SET is_active = FALSE
WHERE mission_id = 'mission-id';
```

### Resetear progreso de un usuario en una misión

```sql
DELETE FROM user_mission_progress
WHERE user_id = 'user-123'
  AND mission_id = 'mission-id';
```

## 🚨 Consideraciones

1. **Misiones Inactivas**: Solo se actualizan misiones con `is_active = TRUE`
2. **Misiones Completadas**: Una vez completada (`status = 'completed'`), no se actualiza más
3. **Creación Automática**: Si el usuario no tiene progreso en una misión, se crea automáticamente cuando realiza la acción
4. **Recompensas**: Las recompensas (XP) solo se otorgan cuando la misión se completa, no por cada incremento
5. **Transacciones**: Si hay error al actualizar el progreso, no falla la creación del certificado/proyecto

## 📚 Referencias

- [Entidad Mission](../server/src/entities/Mission.ts)
- [Entidad UserMissionProgress](../server/src/entities/UserMissionProgress.ts)
- [Schema SQL](../db/initdb/schema.sql)
