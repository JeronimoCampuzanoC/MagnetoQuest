// trivia-service/src/services/TriviaAgent.ts

import OpenAI from 'openai';
import {
  TriviaTopicConfig,
  TriviaQuestion,
  AnswerRecord,
  EvaluationResult,
  TriviaProgress,
  TriviaResults
} from '../types/trivia.types';

export class TriviaAgent {
  private openai: OpenAI;
  private topic: TriviaTopicConfig;
  private totalQuestions: number;
  private currentQuestion: number;
  private answers: AnswerRecord[];
  private sessionId: string;
  private startTime: Date;
  private askedQuestions: string[];

  constructor(apiKey: string, topic: TriviaTopicConfig, totalQuestions: number = 5) {
    this.openai = new OpenAI({ apiKey });
    this.topic = topic;
    this.totalQuestions = totalQuestions;
    this.currentQuestion = 0;
    this.answers = [];
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.askedQuestions = [];
    
    console.log(`\n🎯 [TriviaAgent] Nueva sesión creada: ${this.sessionId}`);
    console.log(`📚 Tema: ${topic.name}`);
    console.log(`🔢 Total de preguntas: ${totalQuestions}\n`);
  }

  private generateSessionId(): string {
    return `trivia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera la siguiente pregunta usando OpenAI
   */
  async generateQuestion(): Promise<TriviaQuestion> {
    if (this.currentQuestion >= this.totalQuestions) {
      throw new Error('Ya se generaron todas las preguntas');
    }

    this.currentQuestion++;
    const difficulty = this.getDifficulty();

    console.log(`\n⏳ [${this.sessionId}] Generando pregunta ${this.currentQuestion}/${this.totalQuestions} (${difficulty})...`);

    const prompt = this.buildQuestionPrompt(difficulty);

    try {
      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en crear preguntas educativas de trivia. Genera preguntas claras, específicas y que requieran respuestas abiertas detalladas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      const elapsed = Date.now() - startTime;
      const content = response.choices[0].message.content || '';
      const question = this.parseQuestionResponse(content, difficulty);
      
      this.askedQuestions.push(question.question);
      
      console.log(`✅ [${this.sessionId}] Pregunta generada en ${elapsed}ms`);
      console.log(`❓ Pregunta: ${question.question}`);
      console.log(`💡 Respuesta esperada: ${question.expectedAnswer.substring(0, 100)}...`);
      if (question.hint) {
        console.log(`🔍 Pista: ${question.hint}`);
      }
      console.log('');
      
      return question;
    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error generando pregunta:`, error);
      throw new Error('No se pudo generar la pregunta');
    }
  }

  /**
   * Evalúa la respuesta del usuario usando OpenAI
   */
  async evaluateAnswer(
    userAnswer: string,
    expectedAnswer: string,
    question: TriviaQuestion
  ): Promise<EvaluationResult> {
    console.log(`\n🔍 [${this.sessionId}] Evaluando respuesta de pregunta ${this.currentQuestion}...`);
    console.log(`📝 Respuesta del usuario: ${userAnswer.substring(0, 150)}...`);
    
    const prompt = `
Evalúa la siguiente respuesta a una pregunta de trivia:

PREGUNTA: ${question.question}
RESPUESTA ESPERADA: ${expectedAnswer}
RESPUESTA DEL USUARIO: ${userAnswer}

Por favor evalúa la respuesta considerando:
1. Exactitud conceptual
2. Completitud de la respuesta
3. Uso correcto de terminología
4. Profundidad de comprensión

Devuelve tu evaluación en el siguiente formato JSON:
{
  "isCorrect": true/false,
  "score": número del 0-10,
  "accuracy": porcentaje del 0-100,
  "feedback": "Feedback detallado y constructivo"
}

IMPORTANTE: Sé justo pero exigente. Una respuesta parcialmente correcta debe recibir puntos parciales.
`;

    try {
      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador experto y justo. Proporcionas feedback constructivo y detallado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const elapsed = Date.now() - startTime;
      const content = response.choices[0].message.content || '';
      const evaluation = this.parseEvaluationResponse(content, expectedAnswer);

      // Guardar registro de respuesta
      const answerRecord: AnswerRecord = {
        questionNumber: this.currentQuestion,
        question: question.question,
        userAnswer,
        expectedAnswer,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        accuracy: evaluation.accuracy,
        feedback: evaluation.feedback,
        timestamp: new Date()
      };

      this.answers.push(answerRecord);

      console.log(`✅ [${this.sessionId}] Evaluación completada en ${elapsed}ms`);
      console.log(`${evaluation.isCorrect ? '✅' : '❌'} Correcta: ${evaluation.isCorrect}`);
      console.log(`📊 Score: ${evaluation.score}/10 | Accuracy: ${evaluation.accuracy}%`);
      console.log(`💬 Feedback: ${evaluation.feedback.substring(0, 100)}...`);
      console.log('');

      return evaluation;
    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error evaluando respuesta:`, error);
      throw new Error('No se pudo evaluar la respuesta');
    }
  }

  /**
   * Obtiene el progreso actual
   */
  getProgress(): TriviaProgress {
    const totalScore = this.answers.reduce((sum, ans) => sum + ans.score, 0);
    const maxScore = this.currentQuestion * 10;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      current: this.currentQuestion,
      total: this.totalQuestions,
      score: totalScore,
      maxScore,
      percentage
    };
  }

  /**
   * Obtiene los resultados finales (JSON a devolver)
   */
  getResults(): TriviaResults {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);
    
    const totalScore = this.answers.reduce((sum, ans) => sum + ans.score, 0);
    const maxScore = this.totalQuestions * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    const correctAnswers = this.answers.filter(ans => ans.isCorrect).length;
    const incorrectAnswers = this.answers.length - correctAnswers;
    
    const averageAccuracy = this.answers.length > 0
      ? Math.round(this.answers.reduce((sum, ans) => sum + ans.accuracy, 0) / this.answers.length)
      : 0;

    // Identificar áreas fuertes y débiles
    const strongAreas = this.answers
      .filter(ans => ans.score >= 8)
      .map(ans => this.extractKeywords(ans.question))
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    const weakAreas = this.answers
      .filter(ans => ans.score < 5)
      .map(ans => this.extractKeywords(ans.question))
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    console.log(`\n📊 [${this.sessionId}] Resultados finales generados:`);
    console.log(`⭐ Score total: ${totalScore}/${maxScore} (${percentage}%)`);
    console.log(`✅ Correctas: ${correctAnswers} | ❌ Incorrectas: ${incorrectAnswers}`);
    console.log(`📈 Promedio de accuracy: ${averageAccuracy}%`);
    console.log(`💪 Áreas fuertes: ${strongAreas.join(', ') || 'Ninguna'}`);
    console.log(`📚 Áreas débiles: ${weakAreas.join(', ') || 'Ninguna'}\n`);

    return {
      sessionId: this.sessionId,
      topic: this.topic,
      startTime: this.startTime,
      endTime,
      duration,
      totalQuestions: this.totalQuestions,
      totalScore,
      maxScore,
      percentage,
      answers: this.answers,
      summary: {
        correctAnswers,
        incorrectAnswers,
        averageAccuracy,
        strongAreas,
        weakAreas
      }
    };
  }

  /**
   * Verifica si la trivia está completa
   */
  isComplete(): boolean {
    return this.currentQuestion >= this.totalQuestions && this.answers.length >= this.totalQuestions;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private getDifficulty(): 'easy' | 'medium' | 'hard' {
    if (this.topic.difficulty) {
      return this.topic.difficulty;
    }

    // Progresión automática de dificultad
    if (this.currentQuestion <= 2) return 'easy';
    if (this.currentQuestion <= 4) return 'medium';
    return 'hard';
  }

  private buildQuestionPrompt(difficulty: 'easy' | 'medium' | 'hard'): string {
    let prompt = `
Genera UNA pregunta de trivia sobre el siguiente tema:

TEMA: ${this.topic.name}
DESCRIPCIÓN: ${this.topic.description}
`;

    if (this.topic.context) {
      prompt += `CONTEXTO: ${this.topic.context}\n`;
    }

    if (this.topic.focusAreas && this.topic.focusAreas.length > 0) {
      prompt += `ÁREAS DE ENFOQUE: ${this.topic.focusAreas.join(', ')}\n`;
    }

    prompt += `
DIFICULTAD: ${difficulty}
PREGUNTA NÚMERO: ${this.currentQuestion} de ${this.totalQuestions}

PREGUNTAS YA REALIZADAS (no repetir temas similares):
${this.askedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

INSTRUCCIONES:
- La pregunta debe requerir una respuesta abierta y detallada
- Debe ser ${difficulty === 'easy' ? 'conceptual y directa' : difficulty === 'medium' ? 'que requiera análisis' : 'compleja y que requiera pensamiento crítico'}
- No hagas preguntas de opción múltiple
- La respuesta esperada debe ser clara y evaluable

Formato de respuesta:
PREGUNTA: [tu pregunta aquí]
RESPUESTA_ESPERADA: [respuesta esperada detallada]
PISTA: [una pista útil opcional]
`;

    return prompt;
  }

  private parseQuestionResponse(content: string, difficulty: 'easy' | 'medium' | 'hard'): TriviaQuestion {
    const questionMatch = content.match(/PREGUNTA:\s*(.+?)(?=RESPUESTA_ESPERADA:|$)/s);
    const answerMatch = content.match(/RESPUESTA_ESPERADA:\s*(.+?)(?=PISTA:|$)/s);
    const hintMatch = content.match(/PISTA:\s*(.+?)$/s);

    return {
      question: questionMatch ? questionMatch[1].trim() : 'Error: No se pudo generar la pregunta',
      expectedAnswer: answerMatch ? answerMatch[1].trim() : 'Error: No se pudo generar la respuesta',
      hint: hintMatch ? hintMatch[1].trim() : undefined,
      difficulty
    };
  }

  private parseEvaluationResponse(content: string, expectedAnswer: string): EvaluationResult {
    try {
      // Intentar parsear como JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        return {
          isCorrect: evaluation.isCorrect || false,
          score: Math.min(10, Math.max(0, evaluation.score || 0)),
          accuracy: Math.min(100, Math.max(0, evaluation.accuracy || 0)),
          feedback: evaluation.feedback || 'Sin feedback disponible',
          expectedAnswer
        };
      }
    } catch (error) {
      console.error('Error parseando evaluación:', error);
    }

    // Fallback si no se puede parsear
    return {
      isCorrect: false,
      score: 0,
      accuracy: 0,
      feedback: 'No se pudo evaluar la respuesta correctamente',
      expectedAnswer
    };
  }

  private extractKeywords(text: string): string[] {
    // Extraer palabras clave simples (puedes mejorar esto)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    return words.slice(0, 3);
  }
}