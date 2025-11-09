// client/src/apps/triviaApp.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './triviaApp.module.css';
import { TriviaService, TriviaTopicConfig, TriviaQuestion, EvaluationResult, TriviaProgress, TriviaResults } from '../services/triviaService';

// Declaración de tipos para Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Controla las diferentes pantallas que le mostramos al usuario
type Screen = 'start' | 'question' | 'results';

export default function TriviaApp() {
  // Estados principales
  const [screen, setScreen] = useState<Screen>('start'); // Inicia en la pantalla de start
  const [loading, setLoading] = useState(false); // Estado para saber si esta esperando respuesta del servidor
  const [error, setError] = useState<string | null>(null); // Estado para errores

  // Estados de la trivia
  const [sessionId, setSessionId] = useState<string>(''); // Identificacion de trivia, en este caso se podria usar el del usuario
  // Almacena la pregunta que el usuario esta viendo en este momento
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [progress, setProgress] = useState<TriviaProgress | null>(null);
  // Resultados finales
  const [results, setResults] = useState<TriviaResults | null>(null);
  // Indica que los resultados finales ya fueron obtenidos y están listos para ver
  const [resultsAvailable, setResultsAvailable] = useState(false);

  // Estados para el flujo optimizado
  const [nextQuestionPreloaded, setNextQuestionPreloaded] = useState<TriviaQuestion | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);

  // Estados del formulario inicial
  const [topicName, setTopicName] = useState('Programación Backend');
  const [topicDescription, setTopicDescription] = useState(
    'Genera preguntas avanzadas sobre desarrollo backend, incluyendo arquitecturas de software, patrones de diseño, optimización de bases de datos, APIs RESTful, microservicios, y mejores prácticas de desarrollo.'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [totalQuestions] = useState(1);

  // Estados para llevar el tiempo
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados para el dictado por voz
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('triviaConfig');

    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      // config tendrá: { userId, title, type, description }
      setUserId(config.userId);
      setTopicName(config.title);
      setTopicDescription(config.description);
      // También podrías usar config.userId si lo necesitas
      console.log(config.userId)
    }
  }, []);

  // Inicializar el reconocimiento de voz
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionAPI();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'es-ES';

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setUserAnswer(prev => prev + finalTranscript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError('No se detectó ninguna voz. Intenta de nuevo.');
        } else if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Función para iniciar/detener el dictado
  const toggleDictation = () => {
    if (!recognition) {
      setError('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (screen !== 'question') {
      return; // Si no es 'question', no hacer nada
    }
    const intervalId = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [screen]);

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
      const response = await TriviaService.startTrivia(topicConfig, totalQuestions); // Inicio de la trivia

      setSessionId(response.sessionId); // Guardamos el sessionId
      setCurrentQuestion(response.firstQuestion); // Mostramos la primera pregunta
      setProgress(response.progress); // Estado inicial del progreso
      setScreen('question'); // Cambia a la pantalla de preguntas
      setEvaluation(null);
      setNextQuestionPreloaded(null);
      setResultsAvailable(false);
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

      // Evaluar respuesta, trae lo que se respondio y el progreso actualizado
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
        await saveTriviaAttempt(finalResults);
        // No navegamos automáticamente: dejamos que el usuario haga click en "Ver resultados"
        setResultsAvailable(true);
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

  // Mostrar pantalla de resultados cuando el usuario hace click
  const handleViewResults = () => {
    setScreen('results');
    setResultsAvailable(false);
  };

  // Continuar a la siguiente pregunta
  const handleNextQuestion = () => {
    setError(null);
    setResultsAvailable(false);

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
    setElapsedTime(0);
  };

  const navigate = useNavigate();

  // Ir a la pantalla de Misiones y limpiar estado local
  const handleGoToMissions = () => {
    console.log('➡️ [TriviaApp] Navegando a Misiones...');
    // limpiar estado local similar a reiniciar
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
    setElapsedTime(0);
    navigate('/misiones');
  };
  const saveTriviaAttempt = async (results: TriviaResults) => {
    try {
      const savedConfig = localStorage.getItem('triviaConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : null;
      const currentUserId = config?.userId;

      if (!currentUserId) {
        console.error('No hay userId para guardar el intento');
        return;
      }

      console.log('Guardando intento para usuario:', currentUserId);

      // Recuperar tipo de trivia del triviaConfig
      let triviaType: string | undefined;
      try {
        const savedConfig = localStorage.getItem('triviaConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          triviaType = config.type;
          console.log('🎯 [TriviaApp] Tipo de trivia:', triviaType);
        }
      } catch (e) {
        console.warn('⚠️ [TriviaApp] No se pudo obtener tipo de trivia del config');
      }

      const attempt = {
        user_id: currentUserId,
        category: topicName,
        difficulty: difficulty,
        score: results.totalScore,
        total_time: results.duration,
        precision_score: Math.round(results.summary.averageAccuracy),
        trivia_type: triviaType // 👈 Nuevo campo
      };

      const response = await fetch('http://localhost:4000/api/trivia-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attempt),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el intento de trivia');
      }

      console.log('✅ Intento de trivia guardado correctamente');

      // Calcular el score final directamente
      const finalScore = results.totalScore % 10 === 0
        ? results.totalScore * 2  // Si es múltiplo de 10
        : (results.totalScore * 2) + (10 - ((results.totalScore * 2) % 10));  // Si no es múltiplo de 10

      // 🎯 Actualizar el progreso diario del usuario (streak y has_done_today)
      try {
        const progressResponse = await fetch(`http://localhost:4000/api/users/${currentUserId}/progress/trivia-completed`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({ score: finalScore })
        });

        if (!progressResponse.ok) {
          throw new Error('Error al actualizar el progreso del usuario');
        }

        const updatedProgress = await progressResponse.json();
        console.log('✅ Progreso de usuario actualizado:', updatedProgress);
        console.log(`🔥 Streak actual: ${updatedProgress.streak} días`);
      } catch (progressError) {
        console.error('Error al actualizar progreso del usuario:', progressError);
        // No fallar la petición principal si hay error en el progreso
      }
    } catch (error) {
      console.error('Error al guardar el intento:', error);
      setError('Error al guardar los resultados');
    }
  };
  // Calcular porcentaje de progreso
  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

  // Función para formatear tiempo en MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Agregar padding de 0 si es necesario
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* PANTALLA INICIAL */}
        {screen === 'start' && (
          <div className={styles.startScreen}>
            <div className={styles.header}>
              <img src="../static/magnetoQuestTrivia.png" alt="MagnetoQuest Trivia" className={styles.logo} />
              <h1 className={styles.title}>¡Comienza la Trivia!</h1>
              {/* <p className={styles.subtitle}>
                Pon a prueba tus conocimientos con nuestra IA
              </p> */}
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
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>¿Qué tema se abordará?</label>
                {/* Mostrar la descripción proveniente de la otra vista como texto estático */}
                <div
                  className={styles.formTextarea}
                  aria-readonly="true"
                  title={topicDescription}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {
                    // Si el tema es uno de los especificados, mostrar solo la descripción
                    ['Habilidades Blandas', 'Empleo Colombiano', 'Entrevistas'].includes(topicName)
                      ? (
                        <>{topicDescription}</>
                      ) : (
                        <>¡Estás a punto de embarcarte en un desafío increíble! Prepárate para poner a prueba tus conocimientos sobre <b>{topicDescription}</b>. Responde a los retos que hemos preparado para ti, ¡y demuestra todo lo que sabes! ¿Te atreves a superar cada pregunta?</>
                      )
                  }
                </div>
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

              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleStartTrivia}
                  disabled={loading}
                >
                  {loading ? 'Generando...' : ' Comenzar Trivia'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA DE PREGUNTAS */}
        {screen === 'question' && currentQuestion && progress && (

          <div>
            <div className={styles.header}>
              <img src="../static/magnetoQuestTrivia.png" alt="MagnetoQuest Trivia" className={styles.logo} />
              <p className={styles.subtitle}>{topicName}</p>

              {/*  Timer */}
              <div className={styles.timerDisplay}>
                <span className={styles.timerIcon}>⏱️</span>
                <span className={styles.timerText}>{formatTime(elapsedTime)}</span>
              </div>
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
                  Preguntas completadas {progress.current} de 5
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
                className={`${styles.feedbackCard} ${evaluation.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
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
                    Siguiente pregunta lista
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
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className={styles.answerTextarea}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Escribe tu respuesta detallada aquí o usa el micrófono para dictar..."
                      disabled={loading}
                    />
                    <div className={styles.micButtonWrapper}>
                      {isListening && (
                        <>
                          <div className={styles.rippleEffect}></div>
                          <div className={styles.rippleEffect}></div>
                          <div className={styles.rippleEffect}></div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={toggleDictation}
                        disabled={loading}
                        className={`${styles.micButton} ${isListening ? styles.micButtonActive : ''}`}
                        title={isListening ? 'Detener dictado' : 'Iniciar dictado'}
                      >
                        {isListening ? '⏸️' : '🎤'}
                      </button>
                    </div>
                  </div>
                  {isListening && (
                    <div className={styles.listeningIndicator}>
                      <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>🔴</span>
                      Escuchando...
                    </div>
                  )}
                </div>

                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleSubmitAnswer}
                    disabled={loading || !userAnswer.trim()}
                  >
                    {loading ? 'Evaluando...' : ' Enviar Respuesta'}
                  </button>
                </div>
              </>
            )}

            {/* Botón para continuar / ver resultados */}
            {evaluation && (
              <div className={styles.buttonContainer}>
                {resultsAvailable ? (
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleViewResults}
                  >
                    Ver resultados
                  </button>
                ) : (
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleNextQuestion}
                    disabled={!nextQuestionPreloaded || isPreloading}
                  >
                    {isPreloading
                      ? ' Cargando...'
                      : nextQuestionPreloaded
                        ? ' Continuar'
                        : ' Preparando...'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PANTALLA DE RESULTADOS */}
        {screen === 'results' && results && (
          <div className={styles.resultsScreen}>
            <div className={styles.header}>
              <img src="../static/magnetoQuestTrivia.png" alt="MagnetoQuest Trivia" className={styles.logo} />
              <h1 className={styles.title}>¡Trivia Completada!</h1>
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
                <div className={styles.statValue}>{formatTime(results.duration)}s</div>
                <div className={styles.statLabel}>Tiempo total</div>
              </div>
            </div>

            {/* FEEDBACK PERSONALIZADO */}
            <div className={styles.summarySection}>
              <div className={styles.summaryTitle}>💬 Análisis personalizado</div>
              <div style={{
                color: '#374151',
                lineHeight: '1.8',
                fontSize: '1rem',
                whiteSpace: 'pre-line',
                textAlign: 'left'
              }}>
                {results.summary.personalizedFeedback}
              </div>
            </div>

            <div className={styles.buttonContainer}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleGoToMissions}
              >
                Volver a misiones
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
    </div >
  );
}