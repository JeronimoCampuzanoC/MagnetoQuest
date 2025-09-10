import React from "react";
import styles from "./progressBar.module.css";

type Props = {
  /** Progreso 0–100 */
  percent: number;
  /** Posiciones de hitos en % (0–100) */
  steps?: number[];
  /** Colores opcionales */
  color?: string;         // color de avance (ej. "#22c55e")
  bgColor?: string;       // fondo de la barra (ej. "#e5e7eb")
  height?: number;        // alto en px (ej. 18)
};

const ProgressBarSteps: React.FC<Props> = ({
  percent,
  steps = [15, 50, 85],   // por defecto tres hitos
  color = "#22c55e",
  bgColor = "#e5e7eb",
  height = 18,
}) => {
  const p = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className={styles.wrapper}
      style={{ background: bgColor, height, borderRadius: height / 2 }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
      role="progressbar"
    >
      {/* Capa de progreso */}
      <div
        className={styles.fill}
        style={{
          width: `${p}%`,
          background: color,
          borderRadius: height / 2,
        }}
      />

      {/* Hitos */}
      {steps.map((s, i) => {
        const left = `${Math.max(0, Math.min(100, s))}%`;
        const unlocked = p >= s;
        const isLast = i === steps.length - 1;

        return (
          <div
            key={i}
            className={`${styles.step} ${unlocked ? styles.unlocked : styles.locked} ${isLast ? styles.last : ""}`}
            style={{
              left,
              width: isLast ? height * 1.4 : height, // 👈 más grande el último
              height: isLast ? height * 1.4 : height,
              marginLeft: isLast ? -(height * 0.7) : -(height / 2),
            }}
          >
            <div className={styles.stepRing} />
            <div className={styles.stepIcon}>
              {unlocked ? (
                <svg viewBox="0 0 24 24" width={isLast ? 16 : 12} height={isLast ? 16 : 12} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width={isLast ? 16 : 12} height={isLast ? 16 : 12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
};

export default ProgressBarSteps;
