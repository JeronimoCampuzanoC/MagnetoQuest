// client/src/apps/TriviaTestUI.tsx
// 🎨 Versión de prueba con datos MOCK para diseño/CSS

import { useState } from 'react';
import styles from './triviaApp.module.css';

type Screen = 'start' | 'question' | 'results';

export default function TriviaTestUI() {
  const [screen, setScreen] = useState<Screen>('start');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 🔥 DATOS MOCK - Puedes editar para probar diferentes estados
  const mockTopicName = 'Programación Backend';
  const mockTopicDescription = 'Genera preguntas avanzadas sobre desarrollo backend, incluyendo arquitecturas de software, patrones de diseño...';
  
  const mockQuestions = [
    {
      questionNumber: 1,
      question: '¿Qué es un patrón de diseño Singleton y cuándo deberías usarlo?',
      hint: 'Piensa en situaciones donde necesitas una única instancia global',
      difficulty: 'easy' as const
    },
    {
      questionNumber: 2,
      question: 'Explica la diferencia entre arquitectura monolítica y microservicios, mencionando ventajas y desventajas de cada una.',
      hint: 'Considera escalabilidad, mantenimiento y complejidad',
      difficulty: 'medium' as const
    },
    {
      questionNumber: 3,
      question: 'Describe cómo implementarías un sistema de caché distribuido para mejorar el rendimiento de una API REST con alta concurrencia.',
      hint: 'Considera Redis, estrategias de invalidación y consistencia',
      difficulty: 'hard' as const
    }
  ];

  const mockEvaluation = {
    isCorrect: true,
    score: 8,
    accuracy: 85,
    feedback: '¡Excelente respuesta! Has demostrado un buen entendimiento del patrón Singleton. Mencionaste correctamente su propósito de garantizar una única instancia y diste ejemplos válidos de uso. Para mejorar, podrías mencionar las consideraciones de thread-safety en entornos multi-hilo.',
    expectedAnswer: 'El patrón Singleton garantiza que una clase tenga solo una instancia y proporciona un punto de acceso global a ella. Se usa cuando: 1) Necesitas controlar el acceso a recursos compartidos (ej: conexión a BD), 2) Quieres un único punto de coordinación, 3) La instancia debe ser accesible globalmente. Implementación típica: constructor privado, método estático getInstance() que retorna la única instancia.'
  };

  const mockProgress = {
    current: currentQuestionIndex + 1,
    total: 3,
    score: 16,
    maxScore: 20,
    percentage: 80
  };

  const mockResults = {
    sessionId: 'mock_session_123',
    topic: { name: mockTopicName, description: mockTopicDescription },
    startTime: '2025-01-15T10:00:00',
    endTime: '2025-01-15T10:15:00',
    duration: 900,
    totalQuestions: 3,
    totalScore: 24,
    maxScore: 30,
    percentage: 80,
    answers: [
      {
        questionNumber: 1,
        question: mockQuestions[0].question,
        userAnswer: 'El Singleton es un patrón que asegura una sola instancia...',
        expectedAnswer: 'Respuesta esperada completa...',
        isCorrect: true,
        score: 8,
        accuracy: 85,
        feedback: 'Muy bien',
        timestamp: '2025-01-15T10:05:00'
      },
      {
        questionNumber: 2,
        question: mockQuestions[1].question,
        userAnswer: 'La arquitectura monolítica tiene todo en un solo...',
        expectedAnswer: 'Respuesta esperada completa...',
        isCorrect: true,
        score: 9,
        accuracy: 92,
        feedback: 'Excelente',
        timestamp: '2025-01-15T10:10:00'
      },
      {
        questionNumber: 3,
        question: mockQuestions[2].question,
        userAnswer: 'Usaría Redis como sistema de caché...',
        expectedAnswer: 'Respuesta esperada completa...',
        isCorrect: false,
        score: 7,
        accuracy: 68,
        feedback: 'Bien, pero faltaron detalles',
        timestamp: '2025-01-15T10:15:00'
      }
    ],
    summary: {
      correctAnswers: 2,
      incorrectAnswers: 1,
      averageAccuracy: 82,
      strongAreas: ['Patrones de diseño', 'Arquitectura de software'],
      weakAreas: ['Sistemas distribuidos', 'Caché']
    }
  };

  // 🎬 FUNCIONES MOCK (sin lógica real)
  const handleStartTrivia = () => {
    console.log('🎯 Mock: Iniciando trivia...');
    setScreen('question');
    setShowEvaluation(false);
    setCurrentQuestionIndex(0);
  };

  const handleSubmitAnswer = () => {
    console.log('📝 Mock: Enviando respuesta...');
    setShowEvaluation(true);
  };

  const handleNextQuestion = () => {
    console.log('➡️ Mock: Siguiente pregunta...');
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowEvaluation(false);
    } else {
      setScreen('results');
    }
  };

  const handleRestart = () => {
    console.log('🔄 Mock: Reiniciando...');
    setScreen('start');
    setShowEvaluation(false);
    setCurrentQuestionIndex(0);
  };

  const progressPercentage = (mockProgress.current / mockProgress.total) * 100;
  const currentQuestion = mockQuestions[currentQuestionIndex];

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

            <div className={styles.configForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tema de la trivia</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={mockTopicName}
                  placeholder="Ej: Programación Backend"
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción detallada</label>
                <textarea
                  className={styles.formTextarea}
                  value={mockTopicDescription}
                  placeholder="Describe qué tipo de preguntas quieres..."
                  readOnly
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dificultad</label>
                <select className={styles.formSelect} value="medium">
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Número de preguntas</label>
                <select className={styles.formSelect} value="3">
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
                >
                  🚀 Comenzar Trivia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA DE PREGUNTAS */}
        {screen === 'question' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.title}>🎯 MagnetoQuest Trivia</h1>
              <p className={styles.subtitle}>{mockTopicName}</p>
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
                  Pregunta {mockProgress.current} de {mockProgress.total}
                </span>
                <span>
                  Score: {mockProgress.score}/{mockProgress.maxScore} ({mockProgress.percentage}%)
                </span>
              </div>
            </div>

            {/* Feedback de la respuesta anterior */}
            {showEvaluation && (
              <div
                className={`${styles.feedbackCard} ${
                  mockEvaluation.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                }`}
              >
                <div className={styles.feedbackHeader}>
                  <span className={styles.feedbackIcon}>
                    {mockEvaluation.isCorrect ? '✅' : '❌'}
                  </span>
                  <span className={styles.feedbackTitle}>
                    {mockEvaluation.isCorrect ? '¡Correcto!' : 'Incorrecto'}
                  </span>
                </div>
                <div className={styles.feedbackScore}>
                  Puntuación: {mockEvaluation.score}/10 | Precisión: {mockEvaluation.accuracy}%
                </div>
                <div className={styles.feedbackText}>{mockEvaluation.feedback}</div>
                <div className={styles.expectedAnswer}>
                  <span className={styles.expectedAnswerLabel}>
                    💡 Respuesta esperada:
                  </span>
                  <div className={styles.expectedAnswerText}>
                    {mockEvaluation.expectedAnswer}
                  </div>
                </div>

                <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#10b981' }}>
                  ✅ Siguiente pregunta lista
                </div>
              </div>
            )}

            {/* Pregunta actual */}
            {!showEvaluation && (
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
                    placeholder="Escribe tu respuesta detallada aquí..."
                    defaultValue=""
                  />
                </div>

                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={handleSubmitAnswer}
                  >
                    📤 Enviar Respuesta
                  </button>
                </div>
              </>
            )}

            {/* Botón para continuar */}
            {showEvaluation && (
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={handleNextQuestion}
                >
                  ➡️ Continuar (Instantáneo)
                </button>
              </div>
            )}
          </div>
        )}

        {/* PANTALLA DE RESULTADOS */}
        {screen === 'results' && (
          <div className={styles.resultsScreen}>
            <div className={styles.header}>
              <h1 className={styles.title}>🏆 ¡Trivia Completada!</h1>
            </div>

            <div className={styles.resultsScore}>
              {mockResults.percentage}%
            </div>
            <div className={styles.resultsTitle}>
              {mockResults.totalScore} de {mockResults.maxScore} puntos
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{mockResults.summary.correctAnswers}</div>
                <div className={styles.statLabel}>Correctas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{mockResults.summary.incorrectAnswers}</div>
                <div className={styles.statLabel}>Incorrectas</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{mockResults.summary.averageAccuracy}%</div>
                <div className={styles.statLabel}>Precisión promedio</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{mockResults.duration}s</div>
                <div className={styles.statLabel}>Tiempo total</div>
              </div>
            </div>

            {mockResults.summary.strongAreas.length > 0 && (
              <div className={styles.summarySection}>
                <div className={styles.summaryTitle}>💪 Áreas fuertes:</div>
                <div className={styles.areasList}>
                  {mockResults.summary.strongAreas.map((area, index) => (
                    <span key={index} className={`${styles.areaTag} ${styles.strongArea}`}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mockResults.summary.weakAreas.length > 0 && (
              <div className={styles.summarySection}>
                <div className={styles.summaryTitle}>📚 Áreas a mejorar:</div>
                <div className={styles.areasList}>
                  {mockResults.summary.weakAreas.map((area, index) => (
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
      </div>
    </div>
  );
}