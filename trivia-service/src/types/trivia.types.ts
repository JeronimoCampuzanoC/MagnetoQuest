/*
TriviaTopicConfig: Permite definir temas con prompts largos y detallados
description: Aquí puedes poner textos largos como "Genera preguntas sobre algoritmos de ordenamiento, estructuras de datos avanzadas..."
focusAreas: Array para especificar subtemas
AnswerRecord: Guarda cada respuesta del usuario con su evaluación
TriviaResults: El JSON final que devolverás al frontend con todo el historial
Interfaces de Request: Para los endpoints de la API
*/

// server/src/types/trivia.types.ts

/**
 * Configuración del tema de la trivia
 * Permite prompts LARGOS y detallados para mejores preguntas
 */
export interface TriviaTopicConfig {
  name: string;           // Nombre corto: "Programación"
  description: string;    // Descripción LARGA del tema
  context?: string;       // Contexto adicional para la IA
  difficulty?: 'easy' | 'medium' | 'hard';
  focusAreas?: string[];  // Áreas específicas a cubrir
}

/**
 * Pregunta generada por la IA
 */
export interface TriviaQuestion {
  question: string;
  expectedAnswer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Registro de una respuesta del usuario
 */
export interface AnswerRecord {
  questionNumber: number;
  question: string;
  userAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  score: number;          // 0-10 puntos
  accuracy: number;       // 0-100 porcentaje
  feedback: string;
  timestamp: Date;
}

/**
 * Resultado de la evaluación de una respuesta
 */
export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  accuracy: number;
  feedback: string;
  expectedAnswer: string;
}

/**
 * Progreso actual de la trivia
 */
export interface TriviaProgress {
  current: number;        // Pregunta actual
  total: number;          // Total de preguntas
  score: number;          // Puntos acumulados
  maxScore: number;       // Máximo posible hasta ahora
  percentage: number;     // Porcentaje de acierto
}

/**
 * Resultados finales de la trivia (JSON a devolver al frontend)
 */
export interface TriviaResults {
  sessionId: string;
  topic: TriviaTopicConfig;
  startTime: Date;
  endTime: Date;
  duration: number;       // En segundos
  totalQuestions: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  answers: AnswerRecord[];
  summary: {
    correctAnswers: number;
    incorrectAnswers: number;
    averageAccuracy: number;
    strongAreas: string[];
    weakAreas: string[];
  };
}

/**
 * Request para iniciar trivia
 */
export interface StartTriviaRequest {
  topicConfig: TriviaTopicConfig;
  totalQuestions?: number;
}

/**
 * Request para evaluar respuesta
 */
export interface SubmitAnswerRequest {
  sessionId: string;
  userAnswer: string;
}