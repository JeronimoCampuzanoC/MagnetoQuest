import React from 'react';
import MissionCard from './missionCard';

export interface OptionItem {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  progress?: number;
  objective?: number;
  ends_at?: string; 
  active: boolean;
}

interface OptionGridProps {
  items: OptionItem[];
  columns?: number;
  checkColor?: string;
  ringColor?: string;
}

const OptionGrid: React.FC<OptionGridProps> = ({ 
  items = [], 
  columns = 2, 
  checkColor = '#22c55e', 
  ringColor = '#ffffff' 
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
        width: '100%',
        height: '100%',
      }}
    >
      {items.map((item) => (
        <MissionCard
          key={item.id}
          item={item}
          checkColor={checkColor}
          ringColor={ringColor}
        />
      ))}
    </div>
  );
};

export default OptionGrid;