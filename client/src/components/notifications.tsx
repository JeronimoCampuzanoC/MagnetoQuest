import React, { useState, useEffect } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Spinner, Badge } from "reactstrap";
import styles from "./notifications.module.css";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'trivia' | 'mission' | 'achievement' | 'welcome' | 'info';
  channel: string;
  timestamp: string;
  metadata?: any;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  hasMore: boolean;
}

const Notificaciones: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggle = () => setOpen(v => !v);

  // Obtener el userId del localStorage (ajustar según tu implementación de auth)
  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_app_user || user.id;
    }
    return null;
  };

  const fetchNotifications = async () => {
    const userId = getUserId();
    if (!userId) {
      setError('Usuario no encontrado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/users/${userId}/notifications`);
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar notificaciones cuando se abre el panel
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return notificationTime.toLocaleDateString('es-ES');
  };

  const getTimeSection = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return 'Hoy';
    if (diffInHours < 48) return 'Ayer';
    if (diffInHours < 168) return 'Esta semana'; // 7 días
    if (diffInHours < 720) return 'Este mes'; // 30 días
    return 'Anteriores';
  };

  const groupNotificationsByTime = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const section = getTimeSection(notification.timestamp);
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(notification);
    });

    // Ordenar las secciones
    const sectionOrder = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores'];
    const orderedGroups: { section: string; notifications: Notification[] }[] = [];
    
    sectionOrder.forEach(section => {
      if (groups[section] && groups[section].length > 0) {
        orderedGroups.push({ section, notifications: groups[section] });
      }
    });

    return orderedGroups;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trivia': return '🧠';
      case 'mission': return '📋';
      case 'achievement': return '🏆';
      case 'welcome': return '🎉';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trivia': return '#3b82f6';
      case 'mission': return '#f59e0b';
      case 'achievement': return '#10b981';
      case 'welcome': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <button className={styles.floatingBtn} onClick={toggle}>
        🔔
        {notifications.length > 0 && (
          <Badge color="danger" className={styles.notificationBadge}>
            {notifications.length > 99 ? '99+' : notifications.length}
          </Badge>
        )}
      </button>

      <Offcanvas isOpen={open} toggle={toggle} direction="end" className={styles.notificationPanel}>
        <OffcanvasHeader toggle={toggle} className={styles.header}>
          <div className={styles.headerContent}>
            <span>🔔 Notificaciones</span>
            {notifications.length > 0 && (
              <Badge color="primary" pill>
                {notifications.length}
              </Badge>
            )}
          </div>
        </OffcanvasHeader>
        
        <OffcanvasBody className={styles.body}>
          {loading && (
            <div className={styles.loadingContainer}>
              <Spinner size="sm" color="primary" />
              <span>Cargando notificaciones...</span>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className={styles.emptyContainer}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No tienes notificaciones</p>
              <small>Aquí aparecerán tus recordatorios y actualizaciones</small>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className={styles.notificationsList}>
              {groupNotificationsByTime(notifications).map(({ section, notifications: groupNotifications }) => (
                <div key={section}>
                  <div className={styles.timeSection}>
                    {section}
                  </div>
                  {groupNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={styles.notificationItem}
                      style={{ borderLeftColor: getNotificationColor(notification.type) }}
                    >
                      <div className={styles.notificationHeader}>
                        <span className={styles.notificationIcon}>
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h6 className={styles.notificationTitle}>
                          {notification.title}
                        </h6>
                        <small className={styles.notificationTime}>
                          {formatTimeAgo(notification.timestamp)}
                        </small>
                      </div>
                      
                      <p className={styles.notificationMessage}>
                        {notification.message}
                      </p>
                      
                      <div className={styles.notificationFooter}>
                        <span className={styles.channelBadge}>
                          {notification.channel === 'email' ? '📧' : '📱'} {notification.channel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button 
                className={styles.refreshButton}
                onClick={fetchNotifications}
                disabled={loading}
              >
                � Actualizar
              </button>
            </div>
          )}
        </OffcanvasBody>
      </Offcanvas>
    </>
  );
};

export default Notificaciones;
