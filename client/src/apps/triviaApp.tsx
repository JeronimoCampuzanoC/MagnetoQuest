// client/src/apps/triviaApp.tsx

import { useState } from 'react';
import styles from './triviaApp.module.css';
import { TriviaService, TriviaTopicConfig, TriviaQuestion, EvaluationResult, TriviaProgress, TriviaResults } from '../services/triviaService';

type Screen = 'start' | 'question' | 'results';

export default function TriviaApp() {
  // Estados principales
  const [screen, setScreen] = useState<Screen>('start');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de la trivia
  const [sessionId, setSessionId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [progress, setProgress] = useState<TriviaProgress | null>(null);
  const [results, setResults] = useState<TriviaResults | null>(null);

  // Estados para el flujo optimizado
  const [nextQuestionPreloaded, setNextQuestionPreloaded] = useState<TriviaQuestion | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);

  // Estados del formulario inicial
  const [topicName, setTopicName] = useState('Programación Backend');
  const [topicDescription, setTopicDescription] = useState(
    'Genera preguntas avanzadas sobre desarrollo backend, incluyendo arquitecturas de software, patrones de diseño, optimización de bases de datos, APIs RESTful, microservicios, y mejores prácticas de desarrollo.'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Iniciar trivia
  const handleStartTrivia = async () => {
    setLoading(true);
    setError(null);

    try {
      const topicConfig: TriviaTopicConfig = {
        name: topicName,
        description: topicDescription,
        difficulty: difficulty,
      };

      console.log('🚀 [TriviaApp] Iniciando trivia...');
      const response = await TriviaService.startTrivia(topicConfig, totalQuestions);

      setSessionId(response.sessionId);
      setCurrentQuestion(response.firstQuestion);
      setProgress(response.progress);
      setScreen('question');
      setEvaluation(null);
      setNextQuestionPreloaded(null);
      console.log('✅ [TriviaApp] Trivia iniciada correctamente');
    } catch (err) {
      console.error('❌ [TriviaApp] Error al iniciar:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la trivia');
    } finally {
      setLoading(false);
    }
  };

  // Enviar respuesta y precargar siguiente pregunta en paralelo
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Por favor escribe una respuesta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 [TriviaApp] Enviando respuesta...');
      
      // 1️⃣ Evaluar respuesta
      const response = await TriviaService.submitAnswer(sessionId, userAnswer);

      setEvaluation(response.evaluation);
      setProgress(response.progress);
      setUserAnswer('');

      console.log(`✅ [TriviaApp] Respuesta evaluada - ${response.evaluation.isCorrect ? 'Correcta' : 'Incorrecta'}`);

      // 2️⃣ Si la trivia está completa, obtener resultados
      if (response.isComplete) {
        console.log('🏁 [TriviaApp] Trivia completada, obteniendo resultados...');
        const finalResults = await TriviaService.getResults(sessionId);
        setResults(finalResults);
        setScreen('results');
        console.log('✅ [TriviaApp] Resultados obtenidos');
      } else {
        // 3️⃣ Si NO está completa, precargar siguiente pregunta en paralelo
        console.log('🔄 [TriviaApp] Precargando siguiente pregunta en background...');
        setIsPreloading(true);
        
        // Ejecutar en paralelo (no bloqueante)
        TriviaService.getNextQuestion(sessionId)
          .then((nextResponse) => {
            const nextQ: TriviaQuestion = {
              questionNumber: nextResponse.questionNumber,
              question: nextResponse.question,
              hint: nextResponse.hint,
              difficulty: nextResponse.difficulty
            };
            setNextQuestionPreloaded(nextQ);
            console.log('✅ [TriviaApp] Siguiente pregunta precargada');
            setIsPreloading(false);
          })
          .catch((err) => {
            console.error('❌ [TriviaApp] Error precargando siguiente pregunta:', err);
            setIsPreloading(false);
            // No mostramos error al usuario, se cargará al hacer clic en continuar
          });
      }

    } catch (err) {
      console.error('❌ [TriviaApp] Error al evaluar:', err);
      setError(err instanceof Error ? err.message : 'Error al evaluar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  // Continuar a la siguiente pregunta
  const handleNextQuestion = () => {
    setError(null);

    // Si ya tenemos la pregunta precargada, usarla
    if (nextQuestionPreloaded) {
      console.log('⚡ [TriviaApp] Usando pregunta precargada (carga instantánea)');
      setCurrentQuestion(nextQuestionPreloaded);
      setEvaluation(null);
      setNextQuestionPreloaded(null);
      setIsPreloading(false);
      return;
    }

    // Si no está precargada, mostrar error
    console.error('❌ [TriviaApp] No hay pregunta precargada');
    setError('Error: La siguiente pregunta no está disponible. Por favor recarga la página.');
  };

  // Reiniciar trivia
  const handleRestart = () => {
    console.log('🔄 [TriviaApp] Reiniciando trivia...');
    setScreen('start');
    setSessionId('');
    setCurrentQuestion(null);
    setUserAnswer('');
    setEvaluation(null);
    setProgress(null);
    setResults(null);
    setError(null);
    setNextQuestionPreloaded(null);
    setIsPreloading(false);
  };

  // Calcular porcentaje de progreso
  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* PANTALLA INICIAL */}
        {screen === 'start' && (
          <div className={styles.startScreen}>
            <div className={styles.header}>
              <h1 className={styles.title}>🎯 MagnetoQuest Trivia</h1>
              <p className={styles.subtitle}>
                Pon a prueba tus conocimientos con nuestra IA
              </p>
            </div>

            {error && (
              <div className={styles.error}>
                <div className={styles.errorTitle}>❌ Error</div>
                <div>{error}</div>
              </div>
            )}

            <div className={styles.configForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tema de la trivia</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="Ej: Programación Backend"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción detallada</label>
                <textarea
                  className={styles.formTextarea}
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  placeholder="Describe qué tipo de preguntas quieres..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dificultad</label>
                <select
                  className={styles.formSelect}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Número de preguntas</label>
                <select
                  className={styles.formSelect}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                >
                  <option value="3">3 preguntas</option>
                  <option value="5">5 preguntas</option>
                  <option value="7">7 preguntas</option>
                  <option value="10">10 preguntas</option>
                </select>
              </div>

              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleStartTrivia}
                  disabled={loading}
                >
                  {loading ? 'Generando...' : '🚀 Comenzar Trivia'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA DE PREGUNTAS */}
        {screen === 'question' && currentQuestion && progress && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.title}>🎯 MagnetoQuest Trivia</h1>
              <p className={styles.subtitle}>{topicName}</p>
            </div>

            {/* Barra de progreso */}
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className={styles.progressText}>
                <span>
                  Pregunta {progress.current} de {progress.total}
                </span>
                <span>
                  Score: {progress.score}/{progress.maxScore} ({progress.percentage}%)
                </span>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <div className={styles.errorTitle}>❌ Error</div>
                <div>{error}</div>
              </div>
            )}

            {/* Feedback de la respuesta anterior */}
            {evaluation && (
              <div
                className={`${styles.feedbackCard} ${
                  evaluation.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                }`}
              >
                <div className={styles.feedbackHeader}>
                  <span className={styles.feedbackIcon}>
                    {evaluation.isCorrect ? '✅' : '❌'}
                  </span>
                  <span className={styles.feedbackTitle}>
                    {evaluation.isCorrect ? '¡Correcto!' : 'Incorrecto'}
                  </span>
                </div>
                <div className={styles.feedbackScore}>
                  Puntuación: {evaluation.score}/10 | Precisión: {evaluation.accuracy}%
                </div>
                <div className={styles.feedbackText}>{evaluation.feedback}</div>
                <div className={styles.expectedAnswer}>
                  <span className={styles.expectedAnswerLabel}>
                    💡 Respuesta esperada:
                  </span>
                  <div className={styles.expectedAnswerText}>
                    {evaluation.expectedAnswer}
                  </div>
                </div>

                {/* Indicador de precarga */}
                {isPreloading && (
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#6b7280' }}>
                    ⏳ Preparando siguiente pregunta...
                  </div>
                )}
                {nextQuestionPreloaded && !isPreloading && (
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#10b981' }}>
                    ✅ Siguiente pregunta lista
                  </div>
                )}
              </div>
            )}

            {/* Pregunta actual */}
            {!evaluation && (
              <>
                <div className={styles.questionCard}>
                  <div className={styles.questionNumber}>
                    Pregunta {currentQuestion.questionNumber} - Dificultad:{' '}
                    {currentQuestion.difficulty}
                  </div>
                  <div className={styles.questionText}>{currentQuestion.question}</div>
                  {currentQuestion.hint && (
                    <div className={styles.hint}>
                      <span className={styles.hintIcon}>💡</span>
                      <span>{currentQuestion.hint}</span>
                    </div>
                  )}
                </div>

                <div className={styles.answerContainer}>
                  <label className={styles.answerLabel}>Tu respuesta:</label>
                  <textarea
                    className={styles.answerTextarea}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta detallada aquí..."
                    disabled={loading}
                  />
                </div>

                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleSubmitAnswer}
                    disabled={loading || !userAnswer.trim()}
                  >
                    {loading ? 'Evaluando...' : '📤 Enviar Respuesta'}
                  </button>
                </div>
              </>
            )}

            {/* Botón para continuar */}
            {evaluation && (
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleNextQuestion}
                  disabled={!nextQuestionPreloaded || isPreloading}
                >
                  {isPreloading 
                    ? '⏳ Cargando...' 
                    : nextQuestionPreloaded 
                      ? '➡️ Continuar (Instantáneo)' 
                      : '⏳ Preparando...'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PANTALLA DE RESULTADOS */}
        {screen === 'results' && results && (
          <div className={styles.resultsScreen}>
            <div className={styles.header}>
              <h1 className={styles.title}>🏆 ¡Trivia Completada!</h1>
            </div>

            <div className={styles.resultsScore}>
              {results.percentage}%
            </div>
            <div className={styles.resultsTitle}>
              {results.totalScore} de {results.maxScore} puntos
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.summary.correctAnswers}</div>
                <div className={styles.statLabel}>Correctas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.summary.incorrectAnswers}</div>
                <div className={styles.statLabel}>Incorrectas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.summary.averageAccuracy}%</div>
                <div className={styles.statLabel}>Precisión promedio</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{results.duration}s</div>
                <div className={styles.statLabel}>Tiempo total</div>
              </div>
            </div>

            {results.summary.strongAreas.length > 0 && (
              <div className={styles.summarySection}>
                <div className={styles.summaryTitle}>💪 Áreas fuertes:</div>
                <div className={styles.areasList}>
                  {results.summary.strongAreas.map((area, index) => (
                    <span key={index} className={`${styles.areaTag} ${styles.strongArea}`}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.summary.weakAreas.length > 0 && (
              <div className={styles.summarySection}>
                <div className={styles.summaryTitle}>📚 Áreas a mejorar:</div>
                <div className={styles.areasList}>
                  {results.summary.weakAreas.map((area, index) => (
                    <span key={index} className={`${styles.areaTag} ${styles.weakArea}`}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.buttonContainer}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleRestart}
              >
                🔄 Nueva Trivia
              </button>
            </div>
          </div>
        )}

        {/* Loading general */}
        {loading && screen === 'start' && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>Generando tu trivia personalizada...</div>
          </div>
        )}
      </div>
    </div>
  );
}