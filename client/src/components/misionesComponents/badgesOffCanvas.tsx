import React, { useState, useEffect, useMemo } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "reactstrap";
import styles from "./badgesOffCanvas.module.css";
import { AuthService } from "../../services/authService";

type CategoryType = 'Trivia' | 'Streak' | 'MagnetoPoints' | 'CV';

type OptionItem = {
  badge_name: string;
  badge_score: number;
  category: CategoryType;
};

// Configuración de categorías con emojis y colores
const categoryConfig: Record<CategoryType, { label: string; emoji: string; className: string }> = {
  Trivia: { label: 'Trivia', emoji: '🧠', className: styles.categoryTrivia },
  Streak: { label: 'Racha', emoji: '🔥', className: styles.categoryStreak },
  MagnetoPoints: { label: 'Magneto', emoji: '⭐', className: styles.categoryMagnetoPoints },
  CV: { label: 'CV', emoji: '📄', className: styles.categoryCV }
};

// Configuración por defecto para categorías desconocidas
const defaultConfig = { 
  label: 'Otro', 
  emoji: '🏅', 
  className: styles.categoryDefault 
};

const BadgesOffCanvas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);

  const [items, setItems] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPoints = useMemo(
    () => items.reduce((acc, b) => acc + (b.badge_score || 0), 0),
    [items]
  );

  useEffect(() => {
    const storedUser = AuthService.getCurrentUserId();
    const userId = storedUser || null;
    
    const fetchBadge = async () => {
      setLoading(true);
      try {
        if (!userId) throw new Error("No user ID found");
        const res = await fetch(`/users/${userId}/badges`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Array<{ 
          badge_name: string; 
          badge_score: number;
          category: CategoryType;
        }> = await res.json();
        
        setItems(data.map(d => {
          // Debug: ver qué categorías llegan del backend
          if (!categoryConfig[d.category]) {
            console.warn(`Categoría desconocida recibida: "${d.category}"`);
          }
          
          return { 
            badge_name: d.badge_name, 
            badge_score: d.badge_score,
            category: d.category
          };
        }));
        setError(null);
      } catch (e: any) {
        console.error("Error fetching insignias", e);
        setError(e?.message || "Error");
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
  }, []);

  return (
    <>
      <button className={styles.floatingBtn} onClick={toggle} aria-label="Tus insignias">
        🎖️
      </button>

      <Offcanvas isOpen={open} toggle={toggle} direction="end" className={styles.canvas}>
        <OffcanvasHeader toggle={toggle}>
          <div className={styles.headerWrap}>
            <div className={styles.headerTitle}>Tus insignias</div>
            <div className={styles.headerMeta}>
              <span className={styles.chip}>
                {items.length} {items.length === 1 ? "insignia" : "insignias"}
              </span>
              <span className={styles.chipSuccess}>{totalPoints} pts</span>
            </div>
          </div>
        </OffcanvasHeader>

        <OffcanvasBody>
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                  <div className={styles.iconCircle} />
                  <div className={styles.badgeText} />
                  <div className={styles.scorePill} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🕊️</div>
              <h4>Aún no tienes insignias</h4>
              <p>Completa misiones y retos para empezar a desbloquearlas.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((b, idx) => {
                // ✅ Usar config por defecto si la categoría no existe
                const config = categoryConfig[b.category] || defaultConfig;
                
                return (
                  <div key={idx} className={styles.card}>
                    <div className={styles.cardContent}>
                      {/* Icono */}
                      <div className={styles.iconCircle} aria-hidden>✅</div>
                      
                      {/* Contenido */}
                      <div className={styles.badgeContent}>
                        {/* Categoría */}
                        <div className={`${styles.categoryBadge} ${config.className}`}>
                          <span>{config.emoji}</span>
                          <span>{config.label}</span>
                        </div>
                        
                        {/* Nombre */}
                        <div className={styles.badgeName}>{b.badge_name}</div>
                      </div>

                      {/* Puntos */}
                      <div className={styles.scorePill}>{b.badge_score} pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default BadgesOffCanvas;