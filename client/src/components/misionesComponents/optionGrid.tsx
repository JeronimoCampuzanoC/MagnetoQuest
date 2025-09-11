import React from "react";
import styles from "./optionGrid.module.css";

export type OptionItem = {
    id: number | string;
    text: string;
    active: boolean;   // ← viene de la BD
};

type Props = {
    items: OptionItem[];     // datos “de BD”
    columns?: 2 | 3;         // columnas de la grilla
    className?: string;
    // estilos opcionales
    checkColor?: string;     // color del check (default #22c55e)
    ringColor?: string;      // aro/fondo del check (default #ffffff)
};

const OptionGridStatic: React.FC<Props> = ({
    items,
    columns = 2,
    className,
    checkColor = "#22c55e",
    ringColor = "#ffffff",
}) => {
    return (
        <div className={`${styles.wrapper} ${className ?? ""}`}>
            {/* Panel izquierdo: grilla */}
            <div
                className={styles.grid}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {items.map((opt) => (
                    <div
                        key={opt.id}
                        className={`${styles.card} ${opt.active ? styles.active : ""}`}
                    >
                        {/* Badge grande (no interactivo) */}
                        <div
                            className={styles.badge}
                            style={{
                                background: ringColor,
                                boxShadow: opt.active
                                    ? "0 0 0 2px #eef2f7" // aro amarillito si está activo
                                    : "0 0 0 2px rgba(0,0,0,0.06)",
                            }}
                            aria-hidden
                        >
                            {opt.active ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="22"
                                    height="22"
                                    fill="none"
                                    stroke={checkColor}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                // candado gris cuando no activo (decorativo)
                                <svg
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="none"
                                    stroke="#dadbdbff"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            )}
                        </div>

                        <p className={styles.text}>{opt.text}</p>
                    </div>
                ))}
            </div>
          
                <div className={styles.imagePlaceholder}>
                    <div className={styles.fakeImage}><img src="../static/personaMisiones.png" style={{width:320}}></img></div>
                </div>
            
        </div>
    );
};

export default OptionGridStatic;
