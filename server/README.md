# MagnetoQuest Server

Backend API para la plataforma MagnetoQuest.

## 🚀 Servicios Automáticos

### Daily Reset Service (Sistema de Racha)

El servidor incluye un **servicio automatizado** que se ejecuta todos los días a medianoche para gestionar las rachas de usuarios:

- ✅ **Se inicia automáticamente** cuando el servidor arranca
- 🕐 **Se ejecuta a las 00:00** (medianoche) todos los días
- ❌ **Resetea streaks** de usuarios que no completaron su trivia
- 🔄 **Resetea `has_done_today`** para todos los usuarios (nuevo día)

**Documentación completa:** [`/docs/DAILY_RESET_SERVICE.md`](../docs/DAILY_RESET_SERVICE.md)

## 🧪 Testing

### Probar el Daily Reset Service

```bash
# Ejecutar script de prueba
./test-daily-reset.sh
```

O manualmente:

```bash
# Ver estado del servicio
curl http://localhost:4000/api/admin/daily-reset/status

# Ejecutar reset manualmente
curl -X POST http://localhost:4000/api/admin/daily-reset/execute
```

## 📦 Instalación

```bash
npm install
```

## 🔧 Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgres://poc_user:poc_pass@localhost:5432/poc_db
PORT=4000
```

## 🏃 Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📚 Endpoints Principales

### User Progress

- `GET /api/users/:userId/progress` - Obtener progreso del usuario
- `PUT /api/users/:userId/progress/trivia-completed` - Marcar trivia completada (actualiza streak y has_done_today)

### Trivia

- `POST /api/trivia-attempts` - Guardar intento de trivia
- `GET /api/trivia-attempts/:userId/stats` - Estadísticas de trivia del usuario

### Administración (Daily Reset)

- `GET /api/admin/daily-reset/status` - Estado del servicio de reset
- `POST /api/admin/daily-reset/execute` - Ejecutar reset manualmente (testing)

### Badges

- `GET /api/users/:userId/badges` - Badges del usuario

### Missions

- `GET /api/users/:userId/missions` - Misiones del usuario

## 🗄️ Base de Datos

### Conectar a PostgreSQL

```bash
docker exec -it poc-postgres bash
psql -U poc_user -d poc_db
```

### Queries Útiles

```sql
-- Ver progreso de todos los usuarios
SELECT u.name, up.streak, up.has_done_today, up.magento_points
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
ORDER BY up.streak DESC;

-- Ver usuarios que perderían su racha en el próximo reset
SELECT u.name, up.streak, up.has_done_today
FROM user_progress up
JOIN app_user u ON u.id_app_user = up.user_id
WHERE up.has_done_today = false AND up.streak > 0;
```

## 🏗️ Estructura del Proyecto

```
server/
├── src/
│   ├── db/
│   │   └── data-source.ts      # Configuración de TypeORM
│   ├── entities/               # Entidades de TypeORM
│   │   ├── AppUser.ts
│   │   ├── UserProgress.ts
│   │   ├── TriviaAttempt.ts
│   │   └── ...
│   ├── services/               # Servicios
│   │   ├── DailyResetService.ts  # ⭐ Servicio de reset diario
│   │   ├── NotificationService.ts
│   │   └── EmailService.ts
│   ├── routes/                 # Rutas de la API
│   └── index.ts                # Punto de entrada principal
├── test-daily-reset.sh         # Script de testing
└── package.json
```

## 📝 Notas Importantes

### ⚠️ Servicio de Reset Diario

- El servidor debe estar **corriendo 24/7** para que el cron funcione
- Si el servidor está apagado a medianoche, el reset **NO se ejecutará**
- Para producción, considera servicios externos (AWS CloudWatch, etc.)
- La zona horaria está configurada en `America/Bogota`

### 🔐 Seguridad

En producción, protege los endpoints de administración (`/api/admin/*`) con autenticación.

## 🛠️ Tecnologías

- **Node.js** + **Express**
- **TypeScript**
- **TypeORM** (ORM)
- **PostgreSQL** (Base de datos)
- **node-cron** (Tareas programadas)
- **nodemailer** (Emails)

## 📖 Documentación Adicional

- [Sistema de Notificaciones](./NOTIFICATION_SYSTEM.md)
- [Daily Reset Service](../docs/DAILY_RESET_SERVICE.md)
- [Sistema de Autenticación](../docs/REAL_AUTH_SYSTEM.md)
