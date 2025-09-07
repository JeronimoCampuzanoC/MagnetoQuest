import React from "react";
import styles from "./triviaButton.module.css";

type Props = {
  title: string;              // línea 1 (grande)
  subtitle: string;           // línea 2 (pequeña)
  imageSrc: string;           // ruta de la imagen (svg/png/webp)
  onClick?: () => void;
  className?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right"; // por defecto "left"
};

const TriviaBannerButton: React.FC<Props> = ({
  title,
  subtitle,
  imageSrc,
  onClick,
  className,
  imageAlt = "",
  imagePosition = "left",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.banner} ${imagePosition === "right" ? styles.reverse : ""} ${className ?? ""}`}
    >
      <div className={styles.imageWrap}>
        <img src={imageSrc} alt={imageAlt} className={styles.image} />
      </div>

      <div className={styles.texts}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>
    </button>
  );
};

export default TriviaBannerButton;
