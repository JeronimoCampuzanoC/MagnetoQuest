import React, { useEffect, useState } from "react";
import { Card, CardBody, Button, Input, Label, FormGroup } from "reactstrap";
import styles from "./profileCard.module.css";

type Props = {
  firstName: string;
  lastName: string;
  lastUpdated: Date | string;
  isActiveSearch: boolean;                 // control externo
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
  // estado interno sincronizado con la prop (para que sea robusto)
  const [active, setActive] = useState(isActiveSearch);
  useEffect(() => setActive(isActiveSearch), [isActiveSearch]);

  const formattedDate = new Date(lastUpdated).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleToggle = (checked: boolean) => {
    setActive(checked);
    onToggleActive?.(checked);
  };

  return (
    <Card className={styles.card}>
      <CardBody className={styles.body}>
        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          {photoUrl ? (
            <img src={photoUrl} alt="Foto de perfil" className={styles.avatarImg} />
          ) : (
            <Button type="button" className={styles.avatarButton} onClick={onAddPhoto}>
              <div className={styles.avatarIcon} aria-hidden><img src="/static/agregar.png" className={styles.avatarIcon}></img></div>
              <span>Añadir foto</span>
            </Button>
          )}
        </div>

        {/* Nombre */}
        <div className="text-center mt-2">
          <div className={styles.firstName}>{firstName}</div>
          <div className={styles.lastName}>{lastName}</div>
          <div className={styles.updated}>Última actualización {formattedDate}</div>
        </div>

        {/* Barra inferior con switch */}
        <div className={styles.statusBar}>
          <FormGroup switch className="d-flex align-items-center mb-0">
            <Input
              id="activeSearchSwitch"
              type="switch"
              role="switch"
              checked={active}
              onChange={(e) => handleToggle(e.target.checked)}
              className={styles.switch}
              aria-label="En búsqueda activa de empleo"
            />
            <Label for="activeSearchSwitch" check className={`${styles.switchLabel} mb-0`}>
              En búsqueda activa de empleo
            </Label>
          </FormGroup>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProfileCard;
