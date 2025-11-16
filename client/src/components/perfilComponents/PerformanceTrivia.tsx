import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/authService';
import styles from './PerformanceTrivia.module.css';

interface TriviaStats {
  averages: {
    score: number;
    precision: number;
    time: number;
  };
  attemptsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  userProgress: {
    streak: number;
    hasDoneToday: boolean;
    magentoPoints: number;
  };
}

export default function PerformanceTrivia() {
  const [stats, setStats] = useState<TriviaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = AuthService.getCurrentUserId();

        if (!userId) {
          throw new Error('Usuario no autenticado');
        }

        const url = `http://localhost:4000/api/trivia-stats/${userId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Error al obtener estadísticas');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorAlert}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.infoAlert}>
        No hay estadísticas disponibles
      </div>
    );
  }

  const totalAttempts =
    Number(stats.attemptsByDifficulty.easy) +
    Number(stats.attemptsByDifficulty.medium) +
    Number(stats.attemptsByDifficulty.hard);

  const hasAttempts = totalAttempts > 0;

  return (
    <div className={styles.container}>

      {!hasAttempts ? (
        <div className={styles.warningAlert}>
          Aún no has realizado ningún intento de trivia. ¡Comienza ahora para ver tus estadísticas!
        </div>
      ) : (
        <>
          {/* Card Superior - Total de Trivias */}
          <div className={styles.headerCard}>
            <div className={styles.headerContent}>
              <div className={styles.headerText}>

                <div className={styles.headerScore}>
                  <span className={styles.scoreNumber}>{totalAttempts}</span>
                </div>
              </div>
              <div className={styles.circleProgress}>
                <svg viewBox="0 0 100 100" className={styles.progressSvg}>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className={styles.progressBackground}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className={styles.progressBar}
                    style={{
                      strokeDasharray: `${(totalAttempts / 10) * 283} 283`
                    }}
                  />
                </svg>
                <div className={styles.brainIcon}>🧠</div>
              </div>
            </div>
            <p className={styles.headerSubtext}>
              Total: {totalAttempts} {totalAttempts === 1 ? 'trivia realizada' : 'trivias realizadas'}
            </p>
          </div>

          {/* Card de Racha */}
          <div className={styles.streakCard}>
            <div className={styles.streakHeader}>
              <div className={styles.streakInfo}>
                <div className={styles.streakFlame}>🔥</div>
                <div className={styles.streakText}>
                  <h3 className={styles.streakNumber}>{stats.userProgress.streak}</h3>
                  <p className={styles.streakLabel}>Días de racha</p>
                </div>
              </div>
              <div className={styles.streakStatus}>
                {stats.userProgress.hasDoneToday ? (
                  <span className={styles.statusBadgeActive}>✓ Completado hoy</span>
                ) : (
                  <span className={styles.statusBadgeInactive}>○ Pendiente hoy</span>
                )}
              </div>
            </div>
            <div className={styles.magentoPoints}>
              <span className={styles.pointsLabel}>Magneto Points</span>
              <span className={styles.pointsValue}>⚡ {stats.userProgress.magentoPoints}</span>
            </div>
          </div>

          <div className={styles.cardsRow}>
            {/* Card Izquierda - Promedios */}
            <div className={styles.card}>
              <h5 className={styles.cardTitle}>Promedios Generales</h5>

              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Puntaje</span>
                  <span className={styles.statValue}>{stats.averages.score.toFixed(1)}/100</span>
                </div>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${stats.averages.score}%`,
                      backgroundColor: stats.averages.score >= 70 ? '#28a745' : stats.averages.score >= 50 ? '#ffc107' : '#dc3545'
                    }}
                  ></div>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Precisión</span>
                  <span className={styles.statValue}>{stats.averages.precision.toFixed(1)}%</span>
                </div>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${stats.averages.precision}%`,
                      backgroundColor: '#17a2b8'
                    }}
                  ></div>
                </div>
              </div>

              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Tiempo Promedio</span>
                  <span className={styles.statValue}>
                    {Math.floor(stats.averages.time / 60)}:{(stats.averages.time % 60).toFixed(0).padStart(2, '0')} min
                  </span>
                </div>

              </div>
            </div>

            {/* Card Derecha - Dificultad */}
            <div className={styles.card}>
              <h5 className={styles.cardTitle}>Intentos por Dificultad</h5>

              <div className={styles.difficultyItem} data-difficulty="easy">
                <div className={styles.difficultyContent}>
                  <span className={styles.difficultyLabel}>⭐ Fácil</span>
                  <span className={styles.difficultyBadge}>
                    {stats.attemptsByDifficulty.easy} {stats.attemptsByDifficulty.easy === 1 ? 'intento' : 'intentos'}
                  </span>
                </div>
              </div>

              <div className={styles.difficultyItem} data-difficulty="medium">
                <div className={styles.difficultyContent}>
                  <span className={styles.difficultyLabel}>⭐⭐ Medio</span>
                  <span className={styles.difficultyBadge}>
                    {stats.attemptsByDifficulty.medium} {stats.attemptsByDifficulty.medium === 1 ? 'intento' : 'intentos'}
                  </span>
                </div>
              </div>

              <div className={styles.difficultyItem} data-difficulty="hard">
                <div className={styles.difficultyContent}>
                  <span className={styles.difficultyLabel}>⭐⭐⭐ Difícil</span>
                  <span className={styles.difficultyBadge}>
                    {stats.attemptsByDifficulty.hard} {stats.attemptsByDifficulty.hard === 1 ? 'intento' : 'intentos'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}