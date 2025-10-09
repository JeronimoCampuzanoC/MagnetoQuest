// client/src/services/triviaService.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export interface TriviaTopicConfig {
  name: string;
  description: string;
  context?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  focusAreas?: string[];
}

export interface TriviaQuestion {
  questionNumber: number;
  question: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TriviaProgress {
  current: number;
  total: number;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  accuracy: number;
  feedback: string;
  expectedAnswer: string;
}

export interface AnswerRecord {
  questionNumber: number;
  question: string;
  userAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  score: number;
  accuracy: number;
  feedback: string;
  timestamp: string;
}

export interface TriviaResults {
  sessionId: string;
  topic: TriviaTopicConfig;
  startTime: string;
  endTime: string;
  duration: number;
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

export interface StartTriviaResponse {
  sessionId: string;
  topic: TriviaTopicConfig;
  totalQuestions: number;
  firstQuestion: TriviaQuestion;
  progress: TriviaProgress;
}

export interface SubmitAnswerResponse {
  evaluation: EvaluationResult;
  progress: TriviaProgress;
  isComplete: boolean;
  nextQuestion: TriviaQuestion | null;
}

/**
 * Servicio para interactuar con la API de Trivia
 */
export class TriviaService {
  /**
   * Inicia una nueva sesión de trivia
   */
  static async startTrivia(
    topicConfig: TriviaTopicConfig,
    totalQuestions: number = 5
  ): Promise<StartTriviaResponse> {
    const response = await fetch(`${API_BASE_URL}/api/trivia/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicConfig,
        totalQuestions,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar la trivia');
    }

    return response.json();
  }

  /**
   * Envía una respuesta y obtiene la evaluación + siguiente pregunta
   */
  static async submitAnswer(
    sessionId: string,
    userAnswer: string
  ): Promise<SubmitAnswerResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/answer/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAnswer }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al evaluar la respuesta');
    }

    return response.json();
  }

  /**
   * Obtiene los resultados finales de la trivia
   */
  static async getResults(sessionId: string): Promise<TriviaResults> {
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/results/${sessionId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener los resultados');
    }

    return response.json();
  }

  /**
   * Obtiene el progreso actual de la trivia
   */
  static async getProgress(sessionId: string): Promise<{
    sessionId: string;
    progress: TriviaProgress;
    isComplete: boolean;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/progress/${sessionId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el progreso');
    }

    return response.json();
  }

  /**
   * Cancela una sesión activa
   */
  static async cancelSession(sessionId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/session/${sessionId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cancelar la sesión');
    }
  }
}
