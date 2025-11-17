
import React, { useEffect, useState } from 'react';

interface DottedLineProps {
  container: HTMLDivElement | null;
  unitId: number;
  x1: number;
  x2: number;
  stroke?: string;
  strokeWidth?: number;
  dashArray?: string;
}

const DottedLine: React.FC<DottedLineProps> = ({
  container,
  unitId,
  x1,
  x2,
  stroke = 'gray',
  strokeWidth = 1,
  dashArray = '6,5',
}) => {
  const [y, setY] = useState(0);

  const updateY = () => {
    if (!container) {
      setY(0);
      return;
    }

    const cell = container.querySelector(
      `[data-unit-id="${unitId}"]`
    ) as HTMLElement | null;

    if (!cell) {
      setY(0);
      return;
    }
    

    const containerRect = container.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const Y_OFFSET = 6; // сдвиг линии по вертикали
    const yCenter = rect.top + rect.height / 2 - containerRect.top + Y_OFFSET;
    setY(yCenter);
  };

  useEffect(() => {
    updateY();

    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateY());
      observer.observe(container);
    }

    window.addEventListener('scroll', updateY);
    window.addEventListener('resize', updateY);

    return () => {
      if (observer && container) {
        observer.unobserve(container);
        observer.disconnect();
      }
      window.removeEventListener('scroll', updateY);
      window.removeEventListener('resize', updateY);
    };
  }, [container, unitId]);

  if (y === 0 || x1 === x2) return null;

  const from = Math.min(x1, x2);
  const to = Math.max(x1, x2);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',   // вся ширина плюс-контейнера (дни * dayWidth)
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <line
        x1={from}
        y1={y}
        x2={to}
        y2={y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    </svg>
  );
};

export default DottedLine;
