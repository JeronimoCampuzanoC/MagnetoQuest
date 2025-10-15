# CV/Resume Management System

## Overview

This system allows users to create and update their CV (Curriculum Vitae) information, which is stored in the database. The system only updates the fields that the user fills out, making it flexible and user-friendly.

## Database Structure

### Resume Table

```sql
CREATE TABLE resume (
    id_resume UUID PRIMARY KEY,
    id_app_user UUID NOT NULL REFERENCES app_user (id_app_user),
    description TEXT,      -- Personal description
    experience TEXT,       -- Professional experience
    courses TEXT,          -- Courses and certifications
    projects TEXT,         -- Featured projects
    languages TEXT,        -- Languages spoken
    references_cv TEXT     -- Professional references
);
```

All fields except `id_resume` and `id_app_user` are nullable, allowing partial updates.

## Backend API Endpoints

### 1. GET `/api/users/:userId/resume`

Get the resume for a specific user.

**Response (200 OK):**

```json
{
  "id_resume": "uuid",
  "id_app_user": "uuid",
  "description": "Software developer passionate about...",
  "experience": "2 years as Frontend Developer...",
  "courses": "React Advanced - Udemy...",
  "projects": "E-commerce platform...",
  "languages": "Spanish (Native), English (Advanced)",
  "references_cv": "John Doe - Manager..."
}
```

**Response (404 Not Found):**

```json
{
  "error": "Resume not found"
}
```

### 2. PUT `/api/users/:userId/resume`

Create or update a resume. Only the fields sent in the request body will be updated.

**Request Body (all fields optional):**

```json
{
  "description": "Updated description",
  "experience": "New experience entry",
  "courses": "New course",
  "projects": "New project",
  "languages": "New language",
  "references_cv": "New reference"
}
```

**Behavior:**

- If the user has no resume: Creates a new one with the provided fields
- If the user already has a resume: Updates only the fields included in the request
- Empty strings are converted to `null`
- Fields not included in the request are left unchanged

**Response (200 OK):**

```json
{
  "id_resume": "uuid",
  "id_app_user": "uuid",
  "description": "Updated description",
  "experience": "New experience entry",
  ...
}
```

## Mission Progress Integration

### CV Mission Type

When a user updates their resume, the system automatically:

1. **Finds Active CV Missions**: Searches for all active missions with category = 'CV'
2. **Updates Progress**: Increments the progress counter for the user's CV missions
3. **Checks Completion**: If `progress >= objective`, marks the mission as completed
4. **Awards XP**: Grants the mission's XP reward to the user's `magento_points`

### Example Flow

```
User updates CV → API receives PUT request
                ↓
         Saves resume to DB
                ↓
    Finds user's CV missions (not_started or in_progress)
                ↓
         Increments progress by 1
                ↓
    If progress >= objective → Mark as completed
                ↓
         Award XP to user
```

### Mission Progress Calculation

Currently, the system increments progress by 1 each time the CV is updated. Alternative approaches could include:

- **Field-based progress**: Calculate progress based on how many fields are filled (e.g., 6 fields = 100%)
- **Completeness score**: Weight certain fields more heavily
- **Update frequency**: Track consecutive updates

## Frontend Component

### CVForm Component

Location: `client/src/components/perfilComponents/CVForm.tsx`

**Features:**

- Loads existing resume data on mount
- Shows empty form if no resume exists
- Only sends fields that have content
- Real-time validation and feedback
- Success/error notifications
- Responsive design
- Helpful tips and examples for each field

**User Experience:**

1. User navigates to "Diseño de mi hoja de vida" tab
2. Form loads existing CV data (or empty if first time)
3. User fills out or updates any fields they want
4. Clicks "Guardar CV"
5. System saves changes and shows success message
6. Mission progress updates automatically in the background

## Testing

### Manual Testing Steps

1. **Create a New Resume:**

   ```bash
   curl -X PUT http://localhost:4000/api/users/{userId}/resume \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Test description",
       "experience": "Test experience"
     }'
   ```

2. **Update Existing Resume (partial):**

   ```bash
   curl -X PUT http://localhost:4000/api/users/{userId}/resume \
     -H "Content-Type: application/json" \
     -d '{
       "courses": "New course added"
     }'
   ```

   Only the `courses` field should be updated, other fields remain unchanged.

3. **Get Resume:**

   ```bash
   curl http://localhost:4000/api/users/{userId}/resume
   ```

4. **Test Mission Progress:**
   - Create a CV mission in the database
   - Assign it to a user via `user_mission_progress`
   - Update the user's resume via the API or UI
   - Check that the mission progress incremented
   - Update again to reach the objective and verify XP award

### Frontend Testing

1. Log in to the application
2. Navigate to "Perfil" → "Diseño de mi hoja de vida"
3. Fill out some fields (not all)
4. Click "Guardar CV"
5. Verify success message appears
6. Refresh the page and verify data persists
7. Update different fields
8. Verify only updated fields changed

## Example SQL Queries

### Check if User Has Resume

```sql
SELECT * FROM resume WHERE id_app_user = 'user-uuid';
```

### View User's CV Missions Progress

```sql
SELECT
  m.title,
  m.category,
  ump.status,
  ump.progress,
  m.objective,
  m.xp_reward
FROM user_mission_progress ump
JOIN mission m ON ump.mission_id = m.mission_id
WHERE ump.user_id = 'user-uuid'
  AND m.category = 'CV';
```

### Create a Test CV Mission

```sql
INSERT INTO mission (title, description, category, xp_reward, objective, is_active)
VALUES (
  'Completa tu CV',
  'Actualiza tu hoja de vida al menos 3 veces',
  'CV',
  30,
  3,
  TRUE
);
```

### Assign Mission to User

```sql
INSERT INTO user_mission_progress (user_id, mission_id, status, progress, starts_at, ends_at)
VALUES (
  'user-uuid',
  'mission-uuid',
  'not_started',
  0,
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

## Error Handling

### Backend

- Returns 404 if resume not found (GET only)
- Returns 500 for database errors
- Logs mission update errors but doesn't fail the resume save

### Frontend

- Shows loading spinner while fetching data
- Displays user-friendly error messages
- Gracefully handles missing resume (404)
- Disables save button while saving
- Auto-hides success message after 3 seconds

## Future Enhancements

1. **CV Completeness Score**: Calculate a percentage based on filled fields
2. **CV Preview**: Show a formatted preview of the CV
3. **PDF Export**: Generate a downloadable PDF of the CV
4. **Templates**: Multiple CV templates to choose from
5. **Field Validation**: Email format, phone numbers, etc.
6. **File Uploads**: Attach documents or photos
7. **Version History**: Track changes over time
8. **AI Suggestions**: Improve CV content with AI
9. **Skills Section**: Dedicated skills with proficiency levels
10. **Education Section**: Separate section for academic background

## Notes

- The system uses the `userId` from `localStorage` (obtained during login)
- All text fields are trimmed before saving
- Empty strings are converted to `null` in the database
- The form supports partial updates (only changed fields)
- Mission progress is updated asynchronously and doesn't block the main operation
