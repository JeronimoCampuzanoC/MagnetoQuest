# Sistema de Puntos Dinámicos para Misiones Application

## 📊 Overview

Las misiones de tipo **Application** ahora otorgan puntos variables basados en qué tan rápido el usuario completa la misión. Esto incentiva la rapidez y la proactividad al aplicar a empleos.

## 🎯 Formula de Cálculo

### Porcentaje de Puntos

```
pointsPercentage = 70% + (timeRemainingPercentage × 0.3)
```

Donde:

- `timeRemainingPercentage` = Porcentaje de tiempo que quedaba al completar la misión
- Rango: 70% (mínimo) a 100% (máximo)

### Puntos Finales

```
actualXpReward = baseXpReward × (pointsPercentage / 100)
```

## 📈 Ejemplos

### Misión: 100 MagnetoPoints base

| Tiempo Restante     | % Tiempo | % Puntos | Puntos Ganados |
| ------------------- | -------- | -------- | -------------- |
| 100% (inmediato)    | 100%     | 100%     | **100 puntos** |
| 75%                 | 75%      | 92.5%    | **93 puntos**  |
| 50%                 | 50%      | 85%      | **85 puntos**  |
| 25%                 | 25%      | 77.5%    | **78 puntos**  |
| 0% (último momento) | 0%       | 70%      | **70 puntos**  |

## 🔄 Flujo de Cálculo

1. **Usuario aplica a empleo** → Incrementa `progress`
2. **Se completa la misión** (`progress >= objective`)
3. **Sistema calcula tiempo restante**:
   ```typescript
   totalDuration = ends_at - starts_at
   timeRemaining = ends_at - completed_at
   timeRemainingPercentage = (timeRemaining / totalDuration) × 100
   ```
4. **Calcula porcentaje de puntos**:
   ```typescript
   completionPercentage = 70 + (timeRemainingPercentage × 0.3)
   ```
5. **Aplica porcentaje a puntos base**:
   ```typescript
   actualXpReward = Math.round(baseXpReward × (completionPercentage / 100))
   ```
6. **Otorga puntos al usuario**

## 📝 Implementación

### Backend: `/server/src/index.ts`

```typescript
// Endpoint: POST /api/users/:userId/missions/:missionId/apply

// Variables para puntos dinámicos
let actualXpReward = 0;
let completionPercentage = 100;

// Al completar la misión
if (missionProgress.progress >= mission.objective) {
  actualXpReward = mission.xp_reward;
  completionPercentage = 100;

  // SOLO para Application missions
  if (
    mission.category === "Application" &&
    missionProgress.starts_at &&
    missionProgress.ends_at
  ) {
    const startTime = new Date(missionProgress.starts_at).getTime();
    const endTime = new Date(missionProgress.ends_at).getTime();
    const completedTime = new Date(missionProgress.completed_at).getTime();

    const totalDuration = endTime - startTime;
    const timeRemaining = endTime - completedTime;

    if (totalDuration > 0) {
      const timeRemainingPercentage = Math.max(
        0,
        Math.min(100, (timeRemaining / totalDuration) * 100)
      );
      completionPercentage = 70 + timeRemainingPercentage * 0.3;
      actualXpReward = Math.round(
        mission.xp_reward * (completionPercentage / 100)
      );
    }
  }

  // Otorgar puntos
  userProgress.magento_points += actualXpReward;
}
```

### Response JSON

```json
{
  "success": true,
  "progress": 1,
  "objective": 1,
  "status": "completed",
  "completed": true,
  "xp_earned": 85,
  "base_xp": 100,
  "completion_percentage": 85.5,
  "message": "¡Felicidades! Has completado la misión y ganado 85 MagnetoPoints (85.5% por velocidad)"
}
```

## 🎮 Casos de Uso

### Caso 1: Usuario rápido (completa en primeras 2 horas)

- Misión de 3 días (72 horas)
- Tiempo restante: 70 horas (97.2%)
- **Gana 99 de 100 puntos** ✅

### Caso 2: Usuario promedio (completa a mitad del tiempo)

- Misión de 3 días
- Tiempo restante: 36 horas (50%)
- **Gana 85 de 100 puntos** ⚡

### Caso 3: Usuario en el último momento

- Misión de 3 días
- Tiempo restante: 1 hora (1.4%)
- **Gana 70 de 100 puntos** ⏰

## ⚠️ Notas Importantes

1. **Solo aplica a misiones Application**: Otras categorías siempre reciben 100% de puntos
2. **Requiere `starts_at` y `ends_at`**: Sin estos campos, se otorgan 100% de puntos
3. **Mínimo garantizado**: Nunca se otorga menos del 70% de los puntos base
4. **Redondeo**: Los puntos finales se redondean al entero más cercano
5. **Notificaciones**: Se registran tanto `xp_reward` (actual) como `base_xp` (original)

## 🔍 Logs de Debug

```
⏱️ [Apply] Tiempo restante: 50.00% → Puntos: 85.00% (85/100)
✅ [Apply] Misión completada! Usuario abc123 recibió 85 MagnetoPoints (85.0% de 100)
```

## 📊 Impacto en Gamificación

- ✅ **Incentiva rapidez** en aplicar a empleos
- ✅ **Mantiene equidad** (70% mínimo garantizado)
- ✅ **Transparencia** (usuario ve el porcentaje ganado)
- ✅ **Diferenciación** (solo Application, no afecta otras misiones)

## 🚀 Testing

### Endpoint de prueba

```bash
POST http://localhost:4000/api/users/:userId/missions/:missionId/apply
```

### Verificar en base de datos

```sql
-- Ver puntos ganados
SELECT
  u.name,
  up.magento_points,
  ump.status,
  ump.starts_at,
  ump.ends_at,
  ump.completed_at,
  m.title,
  m.xp_reward
FROM user_mission_progress ump
JOIN app_user u ON u.id_app_user = ump.user_id
JOIN user_progress up ON up.user_id = ump.user_id
JOIN mission m ON m.mission_id = ump.mission_id
WHERE m.category = 'Application'
  AND ump.status = 'completed';
```

---

**Fecha de implementación**: Noviembre 3, 2025  
**Versión**: 1.0
