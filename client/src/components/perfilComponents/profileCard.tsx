import React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Label,
} from "reactstrap";
import styles from "./profileCard.module.css";

type Props = {
  firstName: string;
  lastName: string;
  lastUpdated: Date | string;            // ej: "2025-08-09"
  isActiveSearch: boolean;
  onToggleActive?: (value: boolean) => void;
  onAddPhoto?: () => void;
  photoUrl?: string | null;
};

const ProfileCard: React.FC<Props> = ({
  firstName,
  lastName,
  lastUpdated,
  isActiveSearch,
  onToggleActive,
  onAddPhoto,
  photoUrl,
}) => {
  const formattedDate = new Date(lastUpdated).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className={styles.card}>
      <CardBody className={styles.body}>
        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          {photoUrl ? (
            <img src={photoUrl} alt="Foto de perfil" className={styles.avatarImg} />
          ) : (
            <button className={styles.avatarButton} onClick={onAddPhoto}>
              <div className={styles.avatarIcon} aria-hidden>＋</div>
              <span>Añadir foto</span>
            </button>
          )}
        </div>

        {/* Nombre */}
        <div className="text-center mt-2">
          <div className={styles.firstName}>{firstName}</div>
          <div className={styles.lastName}>{lastName}</div>
          <div className={styles.updated}>Última actualización  {formattedDate}</div>
        </div>

        {/* Barra inferior con switch */}
        <div className={styles.statusBar}>
          <div className="d-flex align-items-center gap-2">
            <Input
              id="activeSearchSwitch"
              type="switch"
              checked={isActiveSearch}
              onChange={(e) => onToggleActive?.(e.target.checked)}
            />
            <Label for="activeSearchSwitch" className="mb-0">
              En búsqueda activa de empleo
            </Label>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProfileCard;
