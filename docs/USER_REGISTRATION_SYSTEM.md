# Sistema de Registro de Usuarios

## 📋 Overview

Sistema completo de registro de usuarios con asignación automática de misiones iniciales y notificación de bienvenida.

## 🎯 Funcionalidades

### 1. **Registro de Usuario**

- Creación de cuenta con nombre de usuario (requerido)
- Email opcional para notificaciones
- Validación de usuario único
- Inicialización de perfil de progreso

### 2. **Asignación Automática de Misiones**

Al registrarse, cada usuario recibe:

#### 🎮 **1 Misión Diaria** (Trivia)

- **Categorías**: Trivia_Special, Trivia_Abilities, Trivia_Interview, Trivia_Employment
- **Frecuencia**: daily
- **Duración**: 24 horas
- **Selección**: Aleatoria de las disponibles
- **Renovación**: Cada noche a medianoche (gestionado por MissionDelegate)

#### ⚡ **1 Misión Flash**

- **Categorías**: Application o cualquier flash
- **Frecuencia**: flash
- **Duración**: 6 horas
- **Selección**: Aleatoria de las disponibles
- **Urgencia**: Alta - completar rápido para bonus de velocidad

#### 📅 **2 Misiones Semanales**

- **Categorías**: Trivia_Special, Trivia_Abilities, Trivia_Interview, Trivia_Employment
- **Frecuencia**: weekly
- **Duración**: 7 días
- **Selección**: 2 aleatorias de las disponibles

#### 📆 **2 Misiones Mensuales**

- **Categorías**: CV, Certificate, Project
- **Frecuencia**: monthly
- **Duración**: 30 días
- **Selección**: 2 aleatorias de las disponibles

### 3. **Notificación de Bienvenida**

#### Email de Bienvenida 📧

Si el usuario proporciona email, recibe:

- Mensaje de bienvenida personalizado
- Explicación del sistema de misiones
- Descripción de recompensas (MagnetoPoints, Badges, Streaks)
- Información sobre bonus de velocidad
- CTA para ver misiones

#### Registro en Base de Datos

- Notificación guardada en `notification_log`
- Template: `'welcome'`
- Metadata incluye nombre y fecha de registro

## 🔧 Implementación

### Backend: `/server/src/index.ts`

#### Endpoint: `POST /api/users`

**Request Body:**

```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com" // opcional
}
```

**Response (Success - 201):**

```json
{
  "user": {
    "id_app_user": "uuid",
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "created_at": "2025-11-03T..."
  },
  "missions_assigned": [
    { "type": "daily", "mission": "Trivia Habilidades Blandas" },
    { "type": "flash", "mission": "Aplicación Express" },
    { "type": "weekly", "mission": "Trivia Entrevistas" },
    { "type": "weekly", "mission": "Trivia Empleo" },
    { "type": "monthly", "mission": "Subir CV" },
    { "type": "monthly", "mission": "Agregar Proyecto" }
  ],
  "message": "¡Bienvenido a MagnetoQuest! Se te han asignado tus primeras misiones."
}
```

**Response (Usuario existe - 409):**

```json
{
  "error": "Usuario ya existe",
  "user": {
    "id_app_user": "uuid",
    "name": "Juan Pérez"
  }
}
```

### EmailService: `/server/src/services/EmailService.ts`

#### Método: `sendWelcomeEmail(userId, email, name)`

**Características del Email:**

- Diseño con gradiente header (purple/blue)
- Lista detallada de misiones asignadas
- Iconos para cada tipo de misión
- Información sobre sistema de recompensas
- CTA button para ir a misiones
- Responsive y profesional

**Template incluye:**

- Saludo personalizado
- Explicación de cada tipo de misión
- Sistema de MagnetoPoints
- Badges exclusivos
- Racha diaria
- Bonus de velocidad (70%-100%)

### Frontend: `/client/src/components/login.tsx`

#### Características:

- **Modo dual**: Login / Registro
- **Campos**:
  - Nombre de usuario (requerido)
  - Email (solo en modo registro, opcional)
- **Botón toggle** para cambiar entre modos
- **Validación** de campos requeridos
- **Mensajes de éxito** y error
- **Redirección automática** a /misiones después de registro

#### Estados:

```typescript
const [isRegisterMode, setIsRegisterMode] = useState(false);
const [username, setUsername] = useState("");
const [email, setEmail] = useState("");
const [successMessage, setSuccessMessage] = useState("");
```

### AuthService: `/client/src/services/authService.ts`

#### Nuevo método: `registerUser(name, email)`

**Funcionalidad:**

- Envía POST a `/api/users`
- Maneja conflictos (usuario existente)
- Retorna user object normalizado
- Maneja errores de conexión

## 📊 Flujo de Registro

```
Usuario completa formulario
         ↓
POST /api/users
         ↓
Validar nombre único
         ↓
Crear AppUser
         ↓
Crear UserProgress (0 points, 0 streak)
         ↓
[Notificación de bienvenida]
   ├─ Guardar en notification_log
   └─ Enviar email (si tiene)
         ↓
[Asignar misiones]
   ├─ 1 Daily (random trivia)
   ├─ 1 Flash (random)
   ├─ 2 Weekly (random trivias)
   └─ 2 Monthly (random CV/Cert/Project)
         ↓
Retornar user + missions_assigned
         ↓
Frontend guarda sesión
         ↓
Redirige a /misiones
```

## 🗄️ Cambios en Base de Datos

### Tabla `app_user`

```sql
INSERT INTO app_user (name, email)
VALUES ('Juan Pérez', 'juan@email.com');
```

### Tabla `user_progress`

```sql
INSERT INTO user_progress (user_id, streak, has_done_today, magento_points)
VALUES ('user_uuid', 0, false, 0);
```

### Tabla `notification_log`

```sql
INSERT INTO notification_log (user_id, channel, template, metadata)
VALUES (
  'user_uuid',
  'email',
  'welcome',
  '{"user_name": "Juan Pérez", "registered_at": "2025-11-03T..."}'
);
```

### Tabla `user_mission_progress`

Se crean 6 registros (1 daily + 1 flash + 2 weekly + 2 monthly):

```sql
INSERT INTO user_mission_progress
  (user_id, mission_id, progress, status, starts_at, ends_at)
VALUES
  ('user_uuid', 'mission_daily_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '24 hours'),
  ('user_uuid', 'mission_flash_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '6 hours'),
  ('user_uuid', 'mission_weekly_1_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '7 days'),
  ('user_uuid', 'mission_weekly_2_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '7 days'),
  ('user_uuid', 'mission_monthly_1_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '30 days'),
  ('user_uuid', 'mission_monthly_2_uuid', 0, 'not_started', NOW(), NOW() + INTERVAL '30 days');
```

## 🧪 Testing

### 1. Registro Exitoso

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@email.com"}'
```

**Verificar:**

- ✅ Usuario creado en `app_user`
- ✅ User progress creado con 0 puntos
- ✅ 6 misiones asignadas en `user_mission_progress`
- ✅ Notificación en `notification_log`
- ✅ Email recibido (si configurado SMTP)

### 2. Usuario Duplicado

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@email.com"}'
```

**Resultado esperado:**

- Status: 409
- Retorna usuario existente

### 3. Frontend

1. Ir a `/login`
2. Click en "¿No tienes cuenta? Regístrate"
3. Ingresar nombre y email (opcional)
4. Click en "Registrarse"
5. Ver mensaje de éxito
6. Redirección automática a `/misiones`

### 4. Verificar Misiones Asignadas

```sql
SELECT
  u.name,
  m.title,
  m.category,
  m.frequency,
  ump.starts_at,
  ump.ends_at,
  EXTRACT(EPOCH FROM (ump.ends_at - NOW()))/3600 as hours_remaining
FROM user_mission_progress ump
JOIN app_user u ON u.id_app_user = ump.user_id
JOIN mission m ON m.mission_id = ump.mission_id
WHERE u.name = 'Test User'
ORDER BY m.frequency, m.category;
```

## 🔒 Validaciones

1. **Nombre requerido**: No puede estar vacío
2. **Usuario único**: No duplicados en base de datos
3. **Email opcional**: Válido si se proporciona
4. **Misiones disponibles**: Al menos una de cada tipo en BD
5. **Duración correcta**:
   - Daily: 24h
   - Flash: 6h
   - Weekly: 7 días
   - Monthly: 30 días

## 🎨 UI/UX

### Login/Register Toggle

- Botón estilo link para cambiar modo
- Limpia campos al cambiar
- Título dinámico ("Iniciar Sesión" / "Crear Cuenta")
- CTA dinámico ("Iniciar Sesión" / "Registrarse")

### Mensajes

- **Success (verde)**: "¡Registro exitoso! Redirigiendo..."
- **Error (rojo)**: "Error al conectar con el servidor"
- **Info**: Lista de usuarios de prueba (solo en modo login)

### Estados de Loading

- Botón deshabilitado durante proceso
- Spinner con texto "Registrando..." / "Verificando..."
- Inputs deshabilitados

## 📈 Métricas

### Logs del Servidor

```
👤 [Register] Creando nuevo usuario: Juan Pérez
✅ [Register] Usuario creado: uuid-123
✅ [Register] User progress inicializado
📧 [Register] Notificación de bienvenida creada
📧 [Register] Email de bienvenida enviado a juan@email.com
🎯 [Register] Misión diaria asignada: Trivia Habilidades
⚡ [Register] Misión flash asignada: Aplicación Express
📅 [Register] Misión semanal asignada: Trivia Entrevistas
📅 [Register] Misión semanal asignada: Trivia Empleo
📆 [Register] Misión mensual asignada: Subir CV
📆 [Register] Misión mensual asignada: Agregar Certificado
✅ [Register] Usuario Juan Pérez registrado exitosamente con 6 misiones asignadas
```

## 🔄 Integración con Otros Sistemas

### MissionDelegate

- **Renovación diaria**: La misión daily se elimina y reasigna cada noche
- **No afecta** flash, weekly, monthly en registro inicial

### NotificationService

- **Email de bienvenida**: Enviado inmediatamente al registrarse
- **Notificaciones futuras**: Usuario incluido en cron jobs desde el primer día

### DailyResetService

- **Reset de racha**: Usuario parte con streak = 0
- **has_done_today**: Inicia en false

## 🚀 Futuras Mejoras

- [ ] Verificación de email
- [ ] Confirmación por código
- [ ] Recuperación de contraseña
- [ ] Perfil social (sector, ciudad, puesto objetivo)
- [ ] Avatar personalizable
- [ ] Onboarding interactivo
- [ ] Tutorial de primera misión
- [ ] Logros por registro temprano

---

**Fecha de implementación**: Noviembre 3, 2025  
**Versión**: 1.0  
**Autores**: Sistema MagnetoQuest
