
import React, { useState, useEffect } from 'react';

interface DottedLineProps {
  startId: string;
  endId: string;
  container: HTMLDivElement | null;
  stroke?: string;
  strokeWidth?: number;
  dashArray?: string;
}

const DottedLine: React.FC<DottedLineProps> = ({
  startId,
  endId,
  container,
  stroke = 'gray',
  strokeWidth = 1,
  dashArray = '3,5'
}) => {
  const [coords, setCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });

  const updateCoords = () => {
    if (!container) return;
    const startElem = document.getElementById(startId);
    const endElem = document.getElementById(endId);
    const containerRect = container.getBoundingClientRect();
    if (startElem && endElem) {
      const startRect = startElem.getBoundingClientRect();
      const endRect = endElem.getBoundingClientRect();
      
      const x1 = startRect.left + startRect.width / 2 - containerRect.left;
      const y1 = startRect.top + startRect.height / 2 - containerRect.top;
      const x2 = endRect.left + endRect.width / 2 - containerRect.left;
      const y2 = endRect.top + endRect.height / 2 - containerRect.top;
      
      setCoords({ x1, y1, x2, y2 });
    }
  };

  useEffect(() => {
    updateCoords();

    // Обновляем координаты на каждом кадре
    let animationFrameId: number;
    const tick = () => {
      updateCoords();
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();

    // Также следим за изменением размеров контейнера, прокруткой и изменением размера окна
    let containerObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      containerObserver = new ResizeObserver(() => updateCoords());
      containerObserver.observe(container);
    }
    
    window.addEventListener('scroll', updateCoords);
    window.addEventListener('resize', updateCoords);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (containerObserver && container) {
        containerObserver.unobserve(container);
        containerObserver.disconnect();
      }
      window.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
    };
  }, [startId, endId, container]);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      <line
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    </svg>
  );
};

export default DottedLine;
