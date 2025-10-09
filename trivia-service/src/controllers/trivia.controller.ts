/*
Este archivo maneja toda la lógica de los endpoints:

startTrivia:

Crea nueva sesión del TriviaAgent
Genera la primera pregunta
Guarda en memoria (Map)
Devuelve sessionId + primera pregunta


submitAnswer:

Evalúa la respuesta del usuario
Genera la siguiente pregunta
Si es la última, marca como completa
Devuelve evaluación + siguiente pregunta


getResults:

Devuelve el JSON final completo con todo el historial
Solo funciona si la trivia está completa


getProgress: Ver progreso actual
cancelSession: Cancelar una sesión

🔥 Importante: Las sesiones se guardan en memoria (Map). En producción deberías usar Redis, pero para desarrollo funciona perfecto.
*/

// server/src/controllers/trivia.controller.ts

import { Request, Response } from 'express';
import { TriviaAgent } from '../services/TriviaAgent';
import {
  StartTriviaRequest,
  SubmitAnswerRequest,
  TriviaQuestion
} from '../types/trivia.types';

// Almacenamiento en memoria de las sesiones activas
// En producción, esto debería estar en Redis o similar
const activeSessions = new Map<string, {
  agent: TriviaAgent;
  currentQuestion: TriviaQuestion | null;
}>();

/**
 * POST /api/trivia/start
 * Inicia una nueva sesión de trivia
 */
export const startTrivia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topicConfig, totalQuestions = 5 } = req.body as StartTriviaRequest;

    // Validaciones
    if (!topicConfig || !topicConfig.name || !topicConfig.description) {
      res.status(400).json({
        error: 'Se requiere topicConfig con name y description'
      });
      return;
    }

    if (totalQuestions < 1 || totalQuestions > 10) {
      res.status(400).json({
        error: 'totalQuestions debe estar entre 1 y 10'
      });
      return;
    }

    // Verificar que existe OPENAI_API_KEY
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'OPENAI_API_KEY no está configurada en el servidor'
      });
      return;
    }

    // Crear nueva instancia del agente
    const agent = new TriviaAgent(apiKey, topicConfig, totalQuestions);

    // Generar primera pregunta
    const firstQuestion = await agent.generateQuestion();

    // Guardar sesión en memoria
    activeSessions.set(agent.getResults().sessionId, {
      agent,
      currentQuestion: firstQuestion
    });

    // Responder con la sesión iniciada
    res.status(201).json({
      sessionId: agent.getResults().sessionId,
      topic: topicConfig,
      totalQuestions,
      firstQuestion: {
        questionNumber: 1,
        question: firstQuestion.question,
        hint: firstQuestion.hint,
        difficulty: firstQuestion.difficulty
      },
      progress: agent.getProgress()
    });

  } catch (error) {
    console.error('Error en startTrivia:', error);
    res.status(500).json({
      error: 'Error al iniciar la trivia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * POST /api/trivia/answer/:sessionId
 * Envía una respuesta y obtiene la siguiente pregunta
 */
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { userAnswer } = req.body as SubmitAnswerRequest;

    // Validaciones
    if (!userAnswer || userAnswer.trim() === '') {
      res.status(400).json({
        error: 'Se requiere una respuesta (userAnswer)'
      });
      return;
    }

    // Buscar sesión
    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        error: 'Sesión no encontrada o expirada'
      });
      return;
    }

    const { agent, currentQuestion } = session;

    if (!currentQuestion) {
      res.status(400).json({
        error: 'No hay pregunta actual para evaluar'
      });
      return;
    }

    // Evaluar respuesta
    const evaluation = await agent.evaluateAnswer(
      userAnswer,
      currentQuestion.expectedAnswer,
      currentQuestion
    );

    const progress = agent.getProgress();
    const isComplete = agent.isComplete();

    // Si no está completa, generar siguiente pregunta
    let nextQuestion = null;
    if (!isComplete) {
      nextQuestion = await agent.generateQuestion();
      session.currentQuestion = nextQuestion;
    } else {
      // Trivia completada, limpiar sesión
      activeSessions.delete(sessionId);
    }

    // Responder con evaluación y siguiente pregunta (si existe)
    res.json({
      evaluation: {
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        accuracy: evaluation.accuracy,
        feedback: evaluation.feedback,
        expectedAnswer: evaluation.expectedAnswer
      },
      progress,
      isComplete,
      nextQuestion: nextQuestion ? {
        questionNumber: progress.current + 1,
        question: nextQuestion.question,
        hint: nextQuestion.hint,
        difficulty: nextQuestion.difficulty
      } : null
    });

  } catch (error) {
    console.error('Error en submitAnswer:', error);
    res.status(500).json({
      error: 'Error al evaluar la respuesta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * GET /api/trivia/results/:sessionId
 * Obtiene los resultados finales de una trivia completada
 */
export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Buscar sesión (puede estar activa o ya completada)
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      res.status(404).json({
        error: 'Sesión no encontrada. Los resultados solo están disponibles durante la sesión activa.'
      });
      return;
    }

    const { agent } = session;

    if (!agent.isComplete()) {
      res.status(400).json({
        error: 'La trivia aún no está completa',
        progress: agent.getProgress()
      });
      return;
    }

    // Obtener resultados finales
    const results = agent.getResults();

    // Limpiar sesión
    activeSessions.delete(sessionId);

    // Devolver el JSON completo
    res.json(results);

  } catch (error) {
    console.error('Error en getResults:', error);
    res.status(500).json({
      error: 'Error al obtener los resultados',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * GET /api/trivia/progress/:sessionId
 * Obtiene el progreso actual de una trivia
 */
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = activeSessions.get(sessionId);
    
    if (!session) {
      res.status(404).json({
        error: 'Sesión no encontrada'
      });
      return;
    }

    const progress = session.agent.getProgress();

    res.json({
      sessionId,
      progress,
      isComplete: session.agent.isComplete()
    });

  } catch (error) {
    console.error('Error en getProgress:', error);
    res.status(500).json({
      error: 'Error al obtener el progreso',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * DELETE /api/trivia/session/:sessionId
 * Cancela una sesión activa
 */
export const cancelSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = activeSessions.get(sessionId);
    
    if (!session) {
      res.status(404).json({
        error: 'Sesión no encontrada'
      });
      return;
    }

    // Eliminar sesión
    activeSessions.delete(sessionId);

    res.json({
      message: 'Sesión cancelada exitosamente',
      sessionId
    });

  } catch (error) {
    console.error('Error en cancelSession:', error);
    res.status(500).json({
      error: 'Error al cancelar la sesión',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};