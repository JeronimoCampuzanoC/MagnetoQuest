import React, { useState } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "reactstrap";
import styles from "./notifications.module.css";

const Notificaciones: React.FC = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);

  return (
    <>
      <button className={styles.floatingBtn} onClick={toggle}>
        🔔
      </button>

      <Offcanvas isOpen={open} toggle={toggle} direction="end">
        <OffcanvasHeader toggle={toggle}>Notificaciones</OffcanvasHeader>
        <OffcanvasBody>
          Aquí iría el contenido de tus notificaciones 📩
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default Notificaciones;
