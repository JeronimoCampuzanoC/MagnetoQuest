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
    personalizedFeedback: string; 
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

export interface NextQuestionResponse {
  questionNumber: number;
  question: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  progress: TriviaProgress;
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
    console.log('🚀 [TriviaService] Iniciando trivia...');
    
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
      console.error('❌ [TriviaService] Error al iniciar:', error);
      throw new Error(error.error || 'Error al iniciar la trivia');
    }

    const data = await response.json();
    console.log('✅ [TriviaService] Trivia iniciada:', data.sessionId);
    return data;
  }

  /**
   * Envía una respuesta y obtiene SOLO la evaluación
   * (NO genera siguiente pregunta automáticamente)
   */
  static async submitAnswer(
    sessionId: string,
    userAnswer: string
  ): Promise<SubmitAnswerResponse> {
    console.log(`📝 [TriviaService] Enviando respuesta para: ${sessionId}`);
    
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
      console.error('❌ [TriviaService] Error al enviar respuesta:', error);
      throw new Error(error.error || 'Error al evaluar la respuesta');
    }

    const data = await response.json();
    console.log(`✅ [TriviaService] Respuesta evaluada - Score: ${data.evaluation.score}/10`);
    return data;
  }

  /**
   * Obtiene la siguiente pregunta (llamada bajo demanda)
   * Esta función se llama en paralelo mientras el usuario lee el feedback
   */
  static async getNextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    console.log(`➡️ [TriviaService] Obteniendo siguiente pregunta para: ${sessionId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/next-question/${sessionId}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [TriviaService] Error al obtener siguiente pregunta:', error);
      throw new Error(error.error || 'Error al obtener la siguiente pregunta');
    }

    const data = await response.json();
    console.log(`✅ [TriviaService] Siguiente pregunta obtenida: #${data.questionNumber}`);
    return data;
  }

  /**
   * Obtiene los resultados finales de la trivia
   */
  static async getResults(sessionId: string): Promise<TriviaResults> {
    console.log(`🏆 [TriviaService] Obteniendo resultados para: ${sessionId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/results/${sessionId}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [TriviaService] Error al obtener resultados:', error);
      throw new Error(error.error || 'Error al obtener los resultados');
    }

    const data = await response.json();
    console.log(`✅ [TriviaService] Resultados obtenidos - Score: ${data.percentage}%`);
    return data;
  }

  /**
   * Obtiene el progreso actual de la trivia
   */
  static async getProgress(sessionId: string): Promise<{
    sessionId: string;
    progress: TriviaProgress;
    isComplete: boolean;
  }> {
    console.log(`📊 [TriviaService] Consultando progreso para: ${sessionId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/progress/${sessionId}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [TriviaService] Error al obtener progreso:', error);
      throw new Error(error.error || 'Error al obtener el progreso');
    }

    const data = await response.json();
    console.log(`✅ [TriviaService] Progreso: ${data.progress.current}/${data.progress.total}`);
    return data;
  }

  /**
   * Cancela una sesión activa
   */
  static async cancelSession(sessionId: string): Promise<void> {
    console.log(`🚫 [TriviaService] Cancelando sesión: ${sessionId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/trivia/session/${sessionId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [TriviaService] Error al cancelar sesión:', error);
      throw new Error(error.error || 'Error al cancelar la sesión');
    }

    console.log(`✅ [TriviaService] Sesión cancelada`);
  }
}