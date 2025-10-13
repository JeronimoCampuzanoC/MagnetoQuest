// trivia-service/src/controllers/trivia.controller.ts

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

    console.log('\n🎬 [Controller] Iniciando nueva trivia...');
    console.log(`📚 Tema: ${topicConfig?.name}`);
    console.log(`🔢 Preguntas: ${totalQuestions}`);

    // Validaciones
    if (!topicConfig || !topicConfig.name || !topicConfig.description) {
      console.log('❌ [Controller] Error: topicConfig incompleto');
      res.status(400).json({
        error: 'Se requiere topicConfig con name y description'
      });
      return;
    }

    if (totalQuestions < 1 || totalQuestions > 10) {
      console.log('❌ [Controller] Error: totalQuestions fuera de rango');
      res.status(400).json({
        error: 'totalQuestions debe estar entre 1 y 10'
      });
      return;
    }

    // Verificar que existe OPENAI_API_KEY
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('❌ [Controller] Error: OPENAI_API_KEY no configurada');
      res.status(500).json({
        error: 'OPENAI_API_KEY no está configurada en el servidor'
      });
      return;
    }

    // Crear nueva instancia del agente
    const agent = new TriviaAgent(apiKey, topicConfig, totalQuestions);

    // Generar primera pregunta
    const firstQuestion = await agent.generateQuestion();

    const sessionId = agent.getSessionId();;

    // Guardar sesión en memoria
    activeSessions.set(sessionId, {
      agent,
      currentQuestion: firstQuestion
    });

    console.log(`✅ [Controller] Sesión creada: ${sessionId}`);
    console.log(`📊 Sesiones activas: ${activeSessions.size}\n`);

    // Responder con la sesión iniciada
    res.status(201).json({
      sessionId,
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
    console.error('❌ [Controller] Error en startTrivia:', error);
    res.status(500).json({
      error: 'Error al iniciar la trivia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * POST /api/trivia/answer/:sessionId
 * Envía una respuesta y obtiene la evaluación (SIN generar siguiente pregunta)
 */
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { userAnswer } = req.body as SubmitAnswerRequest;

    console.log(`\n📝 [Controller] Evaluando respuesta para sesión: ${sessionId}`);

    // Validaciones
    if (!userAnswer || userAnswer.trim() === '') {
      console.log('❌ [Controller] Error: respuesta vacía');
      res.status(400).json({
        error: 'Se requiere una respuesta (userAnswer)'
      });
      return;
    }

    // Buscar sesión
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.log('❌ [Controller] Error: sesión no encontrada');
      res.status(404).json({
        error: 'Sesión no encontrada o expirada'
      });
      return;
    }

    const { agent, currentQuestion } = session;

    if (!currentQuestion) {
      console.log('❌ [Controller] Error: no hay pregunta actual');
      res.status(400).json({
        error: 'No hay pregunta actual para evaluar'
      });
      return;
    }

    // Evaluar respuesta (SOLO evaluar, NO generar siguiente)
    const evaluation = await agent.evaluateAnswer(
      userAnswer,
      currentQuestion.expectedAnswer,
      currentQuestion
    );

    const progress = agent.getProgress();
    const isComplete = agent.isComplete();

    console.log(`✅ [Controller] Respuesta evaluada`);
    console.log(`📊 Progreso: ${progress.current}/${progress.total}`);
    console.log(`🏁 Completa: ${isComplete ? 'Sí' : 'No'}\n`);

    // Limpiar pregunta actual (la siguiente se generará bajo demanda)
    session.currentQuestion = null;

    // Si está completa, NO eliminamos la sesión aún
    // La sesión se mantiene hasta que se llame a getResults

    // Responder con evaluación (SIN siguiente pregunta)
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
      nextQuestion: null // Siempre null, se obtiene con /next-question
    });

  } catch (error) {
    console.error('❌ [Controller] Error en submitAnswer:', error);
    res.status(500).json({
      error: 'Error al evaluar la respuesta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * GET /api/trivia/next-question/:sessionId
 * Genera la siguiente pregunta (llamada bajo demanda)
 */
export const getNextQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    console.log(`\n➡️ [Controller] Generando siguiente pregunta para: ${sessionId}`);

    // Buscar sesión
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.log('❌ [Controller] Error: sesión no encontrada');
      res.status(404).json({
        error: 'Sesión no encontrada o expirada'
      });
      return;
    }

    const { agent } = session;

    // Verificar si ya está completa
    if (agent.isComplete()) {
      console.log('⚠️ [Controller] La trivia ya está completa');
      res.status(400).json({
        error: 'La trivia ya está completa',
        isComplete: true
      });
      return;
    }

    // Generar siguiente pregunta
    const nextQuestion = await agent.generateQuestion();
    session.currentQuestion = nextQuestion;

    const progress = agent.getProgress();

    console.log(`✅ [Controller] Siguiente pregunta generada`);
    console.log(`📊 Progreso: ${progress.current}/${progress.total}\n`);

    res.json({
      questionNumber: progress.current,
      question: nextQuestion.question,
      hint: nextQuestion.hint,
      difficulty: nextQuestion.difficulty,
      progress
    });

  } catch (error) {
    console.error('❌ [Controller] Error en getNextQuestion:', error);
    res.status(500).json({
      error: 'Error al generar la siguiente pregunta',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * GET /api/trivia/results/:sessionId
 * Obtiene los resultados finales de una trivia completada
 */
/**
 * GET /api/trivia/results/:sessionId
 * Obtiene los resultados finales de una trivia completada
 */
export const getResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    console.log(`\n🏆 [Controller] Obteniendo resultados para: ${sessionId}`);

    // Buscar sesión (debe estar activa)
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      console.log('❌ [Controller] Error: sesión no encontrada');
      res.status(404).json({
        error: 'Sesión no encontrada. Los resultados solo están disponibles durante la sesión activa.'
      });
      return;
    }

    const { agent } = session;

    if (!agent.isComplete()) {
      console.log('⚠️ [Controller] La trivia aún no está completa');
      res.status(400).json({
        error: 'La trivia aún no está completa',
        progress: agent.getProgress()
      });
      return;
    }

    // Obtener resultados finales
    const results = await agent.getResults();  // ✅ Con await

    console.log(`✅ [Controller] Resultados obtenidos`);
    console.log(`🎯 Score final: ${results.totalScore}/${results.maxScore} (${results.percentage}%)`);

    // AHORA SÍ eliminamos la sesión después de obtener resultados
    activeSessions.delete(sessionId);
    console.log(`🗑️ [Controller] Sesión eliminada: ${sessionId}`);
    console.log(`📊 Sesiones activas: ${activeSessions.size}\n`);

    // Devolver el JSON completo
    res.json(results);

  } catch (error) {
    console.error('❌ [Controller] Error en getResults:', error);
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

    console.log(`\n📊 [Controller] Consultando progreso: ${sessionId}`);

    const session = activeSessions.get(sessionId);
    
    if (!session) {
      console.log('❌ [Controller] Error: sesión no encontrada');
      res.status(404).json({
        error: 'Sesión no encontrada'
      });
      return;
    }

    const progress = session.agent.getProgress();

    console.log(`✅ [Controller] Progreso: ${progress.current}/${progress.total}\n`);

    res.json({
      sessionId,
      progress,
      isComplete: session.agent.isComplete()
    });

  } catch (error) {
    console.error('❌ [Controller] Error en getProgress:', error);
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

    console.log(`\n🚫 [Controller] Cancelando sesión: ${sessionId}`);

    const session = activeSessions.get(sessionId);
    
    if (!session) {
      console.log('❌ [Controller] Error: sesión no encontrada');
      res.status(404).json({
        error: 'Sesión no encontrada'
      });
      return;
    }

    // Eliminar sesión
    activeSessions.delete(sessionId);

    console.log(`✅ [Controller] Sesión cancelada: ${sessionId}`);
    console.log(`📊 Sesiones activas: ${activeSessions.size}\n`);

    res.json({
      message: 'Sesión cancelada exitosamente',
      sessionId
    });

  } catch (error) {
    console.error('❌ [Controller] Error en cancelSession:', error);
    res.status(500).json({
      error: 'Error al cancelar la sesión',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};