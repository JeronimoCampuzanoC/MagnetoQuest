import React, { useState, useEffect } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "reactstrap";
import styles from "./badgesOffCanvas.module.css";

type OptionItem = {
  badge_name: string;        // usa el UUID de la misión
  badge_score: number;      // el título (o la descripción si prefieres)
};

const BadgesOffCanvas: React.FC = () => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(v => !v);
  const [items, setItems] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // intenta obtener userId de localStorage, sino usa un default (mismo que en servidor)
    const storedUser = localStorage.getItem('userId')
    const userId = storedUser || '0b40bf7c-9c93-45d8-87f5-8647730f99b9'

    const fetchBadge = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/users/${userId}/badges`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Array<{ badge_name: string; badge_score: number }> = await res.json();
        // mapear directamente al tipo OptionItem
        setItems(data.map(d => ({ badge_name: d.badge_name, badge_score: d.badge_score })));
      } catch (e: any) {
        console.error('Error fetching insignias', e);
        setError(e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchBadge();
    console.log(items);
  }, []);

  return (
    <>
      <button className={styles.floatingBtn} onClick={toggle}>
        🎖️
      </button>

      <Offcanvas isOpen={open} toggle={toggle} direction="end">
        <OffcanvasHeader toggle={toggle}>Tus insignias</OffcanvasHeader>
        <OffcanvasBody>
          {loading ? (
            <div>Cargando insignias...</div>
          ) : error ? (
            <div className={styles.error}>Error: {error}</div>
          ) : items.length === 0 ? (
            <div>No tienes insignias aún.</div>
          ) : (
            <ul className={styles.badgeList}>
              {items.map((b, idx) => (
                <li key={idx} className={styles.badgeItem}>
                  <div className={styles.badgeName}>{b.badge_name}</div>
                  <div className={styles.badgeScore}>{b.badge_score}</div>
                </li>
              ))}
            </ul>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default BadgesOffCanvas;
