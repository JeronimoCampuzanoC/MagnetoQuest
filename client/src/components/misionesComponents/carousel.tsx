import React, { useEffect, useMemo, useState } from "react";
import styles from "./carousel.module.css";

type Item = {
  id: number;
  title: string;
  subtitle: string;
};

const DATA: Item[] = [
  { id: 1, title: "Perfiles", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 2, title: "Conceptos", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 3, title: "Preparemonos", subtitle: "A través de preguntas, reforzarás..." },
  { id: 4, title: "Retos", subtitle: "Una tienda online completa con Next.js y Stripe..." },
  { id: 5, title: "Práctica", subtitle: "Una tienda online completa con Next.js y Stripe..." }
];

type Props = {
  autoPlayMs?: number; // tiempo entre slides
};

const GameStyleCarousel: React.FC<Props> = ({ autoPlayMs = 2800 }) => {
  const [index, setIndex] = useState(0); // índice del item activo (centro)

  // bucle infinito
  const next = () => setIndex((i) => (i + 1) % DATA.length);
  const prev = () => setIndex((i) => (i - 1 + DATA.length) % DATA.length);

  // autoplay
  useEffect(() => {
    const t = setInterval(next, autoPlayMs);
    return () => clearInterval(t);
  }, [autoPlayMs]);

  // para render fácil: tomamos 5 items en orden rotado (siempre son 5)
  const ring = useMemo(() => {
    const arr = [...DATA];
    return arr.map((_, i) => arr[(index + i) % arr.length]);
  }, [index]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Decide un estilo de juego</h2>

      <div className={styles.carousel}>
        <button className={styles.arrow} onClick={prev} aria-label="Anterior">‹</button>

        {/* Pista de slides (mostramos 3 visibles, pero hay 5 tarjetas) */}
        <div className={styles.track}>
          {ring.map((item, i) => {
            // el slide central (i === 1) va destacado
            const isCenter = i === 1;
            return (
              <div
                key={item.id}
                className={`${styles.card} ${isCenter ? styles.cardActive : styles.cardIdle}`}
              >
                {/* espacio para imagen */}
                <div className={styles.imageSlot}>
                  {/* aquí pondrás tu <img src="..."/> */}
                </div>

                <div className={styles.cardText}>
                  <div className={styles.cardTitle}>{item.title}</div>
                  <div className={styles.cardSubtitle}>{item.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button className={styles.arrow} onClick={next} aria-label="Siguiente">›</button>
      </div>
    </div>
  );
};

export default GameStyleCarousel;
