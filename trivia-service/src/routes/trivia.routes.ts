// trivia-service/src/routes/trivia.routes.ts

import { Router } from 'express';
import {
  startTrivia,
  submitAnswer,
  getNextQuestion,
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
 * Envía una respuesta y obtiene SOLO la evaluación
 * (NO genera siguiente pregunta automáticamente)
 * 
 * Params: sessionId
 * Body:
 * {
 *   "userAnswer": "La respuesta del usuario aquí..."
 * }
 * 
 * Response:
 * {
 *   "evaluation": { isCorrect, score, accuracy, feedback, expectedAnswer },
 *   "progress": { current, total, score, maxScore, percentage },
 *   "isComplete": boolean,
 *   "nextQuestion": null
 * }
 */
router.post('/answer/:sessionId', submitAnswer);

/**
 * GET /api/trivia/next-question/:sessionId
 * Genera la siguiente pregunta (llamada bajo demanda)
 * 
 * Params: sessionId
 * 
 * Response:
 * {
 *   "questionNumber": number,
 *   "question": string,
 *   "hint": string | undefined,
 *   "difficulty": "easy" | "medium" | "hard",
 *   "progress": { current, total, score, maxScore, percentage }
 * }
 */
router.get('/next-question/:sessionId', getNextQuestion);

/**
 * GET /api/trivia/results/:sessionId
 * Obtiene los resultados finales (JSON completo)
 * Solo funciona si la trivia está completa
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