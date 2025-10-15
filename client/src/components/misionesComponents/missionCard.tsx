import React from 'react';

// Mapeo de categorías a colores y emojis
const CATEGORY_CONFIG = {
  Trivia: { color: '#f59e0b', emoji: '🎯', label: 'Trivia' },
  Certificate: { color: '#10b981', emoji: '🏆', label: 'Certificado' },
  Project: { color: '#8b5cf6', emoji: '💼', label: 'Proyecto' },
  CV: { color: '#3b82f6', emoji: '📄', label: 'Currículum' },
  default: { color: '#6b7280', emoji: '🎯', label: 'General' },
};

// Calcular tiempo restante
const getTimeRemaining = (endsAt: string | null) => {
  if (!endsAt) return null;
  
  const now = new Date().getTime();
  const end = new Date(endsAt).getTime();
  const diff = end - now;
  
  if (diff <= 0) return { expired: true, text: 'Expirada' };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return { expired: false, text: `${days}d ${hours}h`, urgent: days < 2 };
  if (hours > 0) return { expired: false, text: `${hours}h ${minutes}m`, urgent: hours < 12 };
  return { expired: false, text: `${minutes}m`, urgent: true };
};

interface MissionCardProps {
  item: {
    id: string;
    title?: string;
    description?: string;
    category?: string;
    progress?: number;
    objective?: number;
    ends_at?: string;
    active: boolean;
  };
  checkColor: string;
  ringColor: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({ item, checkColor, ringColor }) => {
  const [timeRemaining, setTimeRemaining] = React.useState(() => 
    item.ends_at ? getTimeRemaining(item.ends_at) : null
  );
  
  const isPlaceholder = item.id.startsWith('placeholder-');
  const isCompleted = item.active;  // active: true = completada ✅
  const isInProgress = !isCompleted && !isPlaceholder;
  
  const { title = '', description = '', category = 'default', progress = 0, objective = 0 } = item;
  const progressPercent = objective > 0 ? (progress / objective) * 100 : 0;
  
  const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.default;

  // Actualizar el tiempo cada minuto
  React.useEffect(() => {
    if (!item.ends_at || isPlaceholder) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(item.ends_at!));
    }, 60000); // cada 60 segundos
    
    return () => clearInterval(interval);
  }, [item.ends_at, isPlaceholder]);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',  // Verde claro si completada
        border: isCompleted ? '2px solid #22c55e' : '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.3s ease',
        boxShadow: isCompleted ? '0 4px 12px rgba(34, 197, 94, 0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        cursor: isPlaceholder ? 'default' : 'pointer',
        opacity: isPlaceholder ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isPlaceholder) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isCompleted 
            ? '0 8px 16px rgba(34, 197, 94, 0.15)' 
            : '0 4px 8px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isPlaceholder) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isCompleted 
            ? '0 4px 12px rgba(34, 197, 94, 0.1)' 
            : '0 2px 4px rgba(0,0,0,0.05)';
        }
      }}
    >
      {/* Icono de estado (check o candado) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: isCompleted ? checkColor : '#d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {isCompleted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke={ringColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
              fill={ringColor}
            />
            <path
              d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
              stroke={ringColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Categoría y tiempo */}
        {!isPlaceholder && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '40px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: `${categoryConfig.color}15`,
                fontSize: '12px',
                fontWeight: '600',
                color: categoryConfig.color,
              }}
            >
              <span>{categoryConfig.emoji}</span>
              <span>{categoryConfig.label}</span>
            </span>
            
            {timeRemaining && !isCompleted && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: timeRemaining.expired 
                    ? '#fee2e2' 
                    : timeRemaining.urgent 
                    ? '#fef3c7' 
                    : '#f3f4f6',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: timeRemaining.expired 
                    ? '#dc2626' 
                    : timeRemaining.urgent 
                    ? '#d97706' 
                    : '#6b7280',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{timeRemaining.text}</span>
              </span>
            )}
          </div>
        )}

        {/* Título */}
        {!isPlaceholder && title && (
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              lineHeight: '1.3',
              marginRight: '40px',
            }}
          >
            {title}
          </h3>
        )}

        {/* Descripción */}
        <p
          style={{
            fontSize: isPlaceholder ? '15px' : '14px',
            color: isPlaceholder ? '#6b7280' : '#4b5563',
            lineHeight: '1.5',
            flex: 1,
            fontWeight: isPlaceholder ? '500' : '400',
          }}
        >
          {description}
        </p>

        {/* Barra de progreso */}
        {!isPlaceholder && objective > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                Progreso
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                {progress} / {objective}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: isCompleted ? '#22c55e' : categoryConfig.color,
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MissionCard;