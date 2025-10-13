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
   * Genera la siguiente pregunta usando OpenAI con formato JSON
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
            content: 'Eres un experto en crear preguntas educativas de trivia. SIEMPRE respondes ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones, sin texto adicional. Tu respuesta DEBE empezar con { y terminar con }.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
        // ❌ NO usar response_format con gpt-4 (solo gpt-4-turbo)
      });

      const elapsed = Date.now() - startTime;
      const content = response.choices[0].message.content || '';
      const question = this.parseQuestionResponse(content, difficulty);

      this.askedQuestions.push(question.question);

      console.log(`✅ [${this.sessionId}] Pregunta generada en ${elapsed}ms`);
      console.log(`❓ Pregunta: ${question.question}`);
      console.log(`💡 Respuesta esperada: ${question.expectedAnswer.substring(0, 100)}...`);
      if (question.hint) {
        console.log(`🔑 Pista: ${question.hint}`);
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

Por favor evalúa la respuesta considerando (en orden de importancia):
1. ¿Comprende la idea principal del concepto? (peso: 50%)
2. ¿Puede explicarlo razonablemente con sus propias palabras? (peso: 30%)
3. ¿Menciona detalles o conceptos relacionados? (peso: 20%)

NOTA: La terminología técnica exacta NO es obligatoria si la comprensión es evidente.

Devuelve tu evaluación en el siguiente formato JSON:
{
  "isCorrect": true/false,
  "score": número del 0-10,
  "accuracy": porcentaje del 0-100,
  "feedback": "Feedback constructivo y alentador"
}


CRITERIOS DE PUNTUACIÓN (sé generoso):
- 9-10: Excelente comprensión con detalles adicionales
- 7-8: Buena comprensión del concepto principal
- 5-6: Comprensión básica o parcial
- 3-4: Comprensión muy limitada pero con algo correcto
- 0-2: Respuesta completamente incorrecta o sin relación

IMPORTANTE: Si el usuario demuestra que entiende el concepto principal, aunque sea de forma simple, debe recibir AL MENOS 6/10. Sé motivador y reconoce el esfuerzo.
`;

    try {
      const startTime = Date.now();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador experto y justo. Proporcionas feedback constructivo y detallado. SIEMPRE respondes ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones. Tu respuesta DEBE empezar con { y terminar con }.'
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
   * Genera un feedback personalizado completo usando OpenAI
   */
  private async generatePersonalizedFeedback(
    correctAnswers: number,
    incorrectAnswers: number,
    averageAccuracy: number,
    answers: AnswerRecord[]
  ): Promise<string> {
    console.log(`\n💬 [${this.sessionId}] Generando feedback personalizado...`);

    // Construir resumen detallado de cada respuesta
    const answersResume = answers.map((ans, index) => `
Pregunta ${index + 1}: ${ans.question}
Respuesta del usuario: ${ans.userAnswer.substring(0, 200)}${ans.userAnswer.length > 200 ? '...' : ''}
Evaluación: ${ans.isCorrect ? ' Correcta' : '❌ Incorrecta'} - Score: ${ans.score}/10 (${ans.accuracy}% precisión)
Feedback recibido: ${ans.feedback}
    `).join('\n---\n');

    const totalScore = answers.reduce((sum, ans) => sum + ans.score, 0);
    const maxPossibleScore = this.totalQuestions * 10;

const prompt = `
Eres un tutor experto, cercano y motivador. Has finalizado una sesión de trivia sobre "${this.topic.name}" con un estudiante.

 RESULTADOS GENERALES:
- Total de preguntas: ${this.totalQuestions}
- Respuestas correctas: ${correctAnswers} 
- Respuestas incorrectas: ${incorrectAnswers} 
- Precisión promedio: ${averageAccuracy}%
- Puntuación total: ${totalScore}/${maxPossibleScore} puntos (${Math.round((totalScore / maxPossibleScore) * 100)}%)

 DETALLE COMPLETO DE CADA RESPUESTA:
${answersResume}

--- INSTRUCCIONES ---

1) Detección de dominio:
- Deduce el dominio principal usando "${this.topic.name}" + los conceptos y títulos visibles en ${answersResume} .
- Si hay ambigüedad, elige el dominio con más señales en ${answersResume}. No inventes datos.

2) Redacción del feedback (130–170 palabras), en prosa natural (sin viñetas):
- **Saludo amigable** breve.
- **Fortalezas —** Nombra explícitamente los temas/preguntas acertadas y explica qué comprensión demuestran, citando conceptos reales detectados.
- **Cómo mejorar —** Señala los temas/preguntas con dificultad y propone 2 acciones concretas **adaptadas al dominio detectado** (p. ej., “practica role-plays de escucha activa”, “usa EXPLAIN para optimizar consultas”, “traza una línea de tiempo de los hechos clave”). Evita vaguedades.
- **Despedida motivadora** breve y realista.

---

ESTILO:
- En segunda persona (tú, te, tu).  
- Tono amigable, humano y realista.  
- Centrado en lo académico, no en lo emocional.  
- Sin listas ni numeraciones en el texto final.  
- Debe leerse como un comentario fluido de un mentor que valora tanto los aciertos como las oportunidades de mejora.

IMPORTANTE: Aunque el estudiante haya tenido bajo puntaje, el feedback debe ser constructivo y motivador, nunca desalentador.
`;


    try {
      const startTime = Date.now();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un tutor experto, cercano y motivador. Escribes feedback personalizado que inspira a los estudiantes a seguir aprendiendo. Tu estilo es conversacional, específico y siempre positivo.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,  // Más creativo para el feedback
        max_tokens: 800    // Suficiente para 200-300 palabras
      });

      const elapsed = Date.now() - startTime;
      const feedback = response.choices[0].message.content || 'No se pudo generar el feedback personalizado.';

      console.log(`✅ [${this.sessionId}] Feedback personalizado generado en ${elapsed}ms`);
      console.log(`📝 Longitud del feedback: ${feedback.length} caracteres`);
      console.log(`📄 Preview: ${feedback.substring(0, 150)}...\n`);

      return feedback;

    } catch (error) {
      console.error(`❌ [${this.sessionId}] Error generando feedback personalizado:`, error);

      // Fallback: feedback genérico si falla la IA
      const fallbackFeedback = `¡Gracias por completar esta trivia sobre ${this.topic.name}! Has obtenido ${correctAnswers} respuestas correctas de ${this.totalQuestions} preguntas, logrando una precisión del ${averageAccuracy}%. ${correctAnswers > incorrectAnswers ? '¡Excelente trabajo! Demuestras un buen dominio del tema.' : 'Has dado un buen primer paso. Con práctica y dedicación, seguro mejorarás tu comprensión del tema.'} Revisa las preguntas donde tuviste dificultades y tómate el tiempo para entender los conceptos. Cada intento es una oportunidad de aprendizaje. ¡Sigue así y no te rindas!`;

      return fallbackFeedback;
    }
  }

  /**
   * Obtiene los resultados finales (JSON a devolver)
   */
  async getResults(): Promise<TriviaResults> {
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

    console.log(`\n📊 [${this.sessionId}] Generando resultados finales...`);
    console.log(`⭐ Score total: ${totalScore}/${maxScore} (${percentage}%)`);
    console.log(`✅ Correctas: ${correctAnswers} | ❌ Incorrectas: ${incorrectAnswers}`);
    console.log(`📈 Promedio de accuracy: ${averageAccuracy}%`);

    // Generar feedback personalizado con IA
    const personalizedFeedback = await this.generatePersonalizedFeedback(
      correctAnswers,
      incorrectAnswers,
      averageAccuracy,
      this.answers
    );

    console.log(`✅ [${this.sessionId}] Resultados completos generados\n`);

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
        personalizedFeedback  // ← NUEVO: Feedback generado por IA
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

🆕 IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido en este formato exacto:

{
  "pregunta": "Tu pregunta aquí",
  "respuestaEsperada": "La respuesta esperada detallada",
  "pista": "Una pista útil opcional o null si no aplica"
}

NO incluyas texto adicional, explicaciones, ni formato markdown. SOLO el objeto JSON.
`;

    return prompt;
  }

  /**
   * 🆕 Parseo mejorado con JSON
   */
  private parseQuestionResponse(content: string, difficulty: 'easy' | 'medium' | 'hard'): TriviaQuestion {
    try {
      // Intentar parsear directamente como JSON
      let parsed;

      // Buscar JSON en el contenido
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }

      // Validar que tenga los campos necesarios
      if (parsed.pregunta && parsed.respuestaEsperada) {
        return {
          question: parsed.pregunta.trim(),
          expectedAnswer: parsed.respuestaEsperada.trim(),
          hint: parsed.pista && parsed.pista !== 'null' ? parsed.pista.trim() : undefined,
          difficulty
        };
      }
    } catch (error) {
      console.error('⚠️ Error parseando JSON de pregunta:', error);
      console.log('Contenido recibido:', content);
    }

    // 🔄 FALLBACK: Método anterior si JSON falla
    console.log('⚠️ Usando método de parsing legacy (formato texto)');
    const questionMatch = content.match(/(?:PREGUNTA:|pregunta:)\s*(.+?)(?=(?:RESPUESTA_ESPERADA:|respuestaEsperada:|$))/si);
    const answerMatch = content.match(/(?:RESPUESTA_ESPERADA:|respuestaEsperada:)\s*(.+?)(?=(?:PISTA:|pista:|$))/si);
    const hintMatch = content.match(/(?:PISTA:|pista:)\s*(.+?)$/si);

    return {
      question: questionMatch ? questionMatch[1].trim() : content.split('\n')[0].trim() || 'Error: No se pudo generar la pregunta',
      expectedAnswer: answerMatch ? answerMatch[1].trim() : 'Error: No se pudo generar la respuesta',
      hint: hintMatch ? hintMatch[1].trim() : undefined,
      difficulty
    };
  }

  /**
   * 🆕 Parseo mejorado de evaluación con JSON
   */
  private parseEvaluationResponse(content: string, expectedAnswer: string): EvaluationResult {
    try {
      // Intentar parsear como JSON
      let parsed;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }

      return {
        isCorrect: parsed.isCorrect || false,
        score: Math.min(10, Math.max(0, parsed.score || 0)),
        accuracy: Math.min(100, Math.max(0, parsed.accuracy || 0)),
        feedback: parsed.feedback || 'Sin feedback disponible',
        expectedAnswer
      };
    } catch (error) {
      console.error('⚠️ Error parseando evaluación JSON:', error);
      console.log('Contenido recibido:', content);
    }

    // Fallback si no se puede parsear
    return {
      isCorrect: false,
      score: 0,
      accuracy: 0,
      feedback: 'No se pudo evaluar la respuesta correctamente. Por favor intenta de nuevo.',
      expectedAnswer
    };
  }

  

    /**
   * Obtiene el sessionId de la trivia
   */
  getSessionId(): string {
    return this.sessionId;
  }

}