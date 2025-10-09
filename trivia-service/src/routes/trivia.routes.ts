//Este archivo define todas las rutas de la API

// server/src/routes/trivia.routes.ts

import { Router } from 'express';
import {
  startTrivia,
  submitAnswer,
  getResults,
  getProgress,
  cancelSession
} from '../controllers/trivia.controller';

const router = Router();

/**
 * POST /api/trivia/start
 * Inicia una nueva sesión de trivia
 * 
 * Body:
 * {
 *   "topicConfig": {
 *     "name": "Programación",
 *     "description": "Preguntas sobre algoritmos, estructuras de datos...",
 *     "context": "Enfocado en desarrollo backend",
 *     "difficulty": "medium",
 *     "focusAreas": ["algoritmos", "complejidad", "estructuras"]
 *   },
 *   "totalQuestions": 5
 * }
 */
router.post('/start', startTrivia);

/**
 * POST /api/trivia/answer/:sessionId
 * Envía una respuesta y obtiene la siguiente pregunta
 * 
 * Params: sessionId
 * Body:
 * {
 *   "userAnswer": "La respuesta del usuario aquí..."
 * }
 */
router.post('/answer/:sessionId', submitAnswer);

/**
 * GET /api/trivia/results/:sessionId
 * Obtiene los resultados finales (JSON completo)
 * 
 * Params: sessionId
 */
router.get('/results/:sessionId', getResults);

/**
 * GET /api/trivia/progress/:sessionId
 * Obtiene el progreso actual
 * 
 * Params: sessionId
 */
router.get('/progress/:sessionId', getProgress);

/**
 * DELETE /api/trivia/session/:sessionId
 * Cancela una sesión activa
 * 
 * Params: sessionId
 */
router.delete('/session/:sessionId', cancelSession);

export default router;