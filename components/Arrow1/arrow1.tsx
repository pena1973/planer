
import React from 'react';

interface ArrowProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  strokeWidth?: number;  // Ширина стрелки
  strokeStyle?: 'solid' | 'dashed'; // Стиль стрелки
}

const Arrow: React.FC<ArrowProps> = ({ startX, startY, endX, endY, strokeWidth = 2, strokeStyle = 'solid' }) => {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="black"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeStyle === 'dashed' ? '5, 5' : undefined} // Устанавливаем пунктирный стиль
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="black" />
        </marker>
      </defs>
    </svg>
  );
};

export default Arrow;
