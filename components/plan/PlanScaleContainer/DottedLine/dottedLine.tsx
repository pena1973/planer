
import React, { useEffect, useState } from 'react';

interface DottedLineProps {
  container: HTMLDivElement | null;
  unitId: number;
  x1: number;
  x2: number;
  stroke?: string;
  strokeWidth?: number;
  dashArray?: string;
   
  // NEW: флаги для визуализации обрезанных концов
  clippedStart?: boolean;
  clippedEnd?: boolean;
   
  recalcKey?: number;
}



// interface DottedLineProps {
//   container: HTMLDivElement | null;
//   unitId: number;
//   x1: number;
//   x2: number;
//   stroke?: string;
//   strokeWidth?: number;
//   dashArray?: string;
// }

const DottedLine: React.FC<DottedLineProps> = ({
  container,
  unitId,
  x1,
  x2,
  stroke = 'gray',
  strokeWidth = 1,
  dashArray = '6,5',
  recalcKey
}) => {
  const [y, setY] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateMetrics = () => {
    if (!container) {
      setY(0);
      setSize({ width: 0, height: 0 });
      return;
    }

    const cell = container.querySelector(
      `[data-unit-id="${unitId}"]`
    ) as HTMLElement | null;

    const containerRect = container.getBoundingClientRect();
    const Y_OFFSET = 6;

    if (cell) {
      const rect = cell.getBoundingClientRect();
      const yCenter = rect.top + rect.height / 2 - containerRect.top + Y_OFFSET;
      setY(yCenter);
    } else {
      setY(0);
    }

    setSize({
      width: container.scrollWidth || container.clientWidth,
      height: container.scrollHeight || container.clientHeight,
    });
  };

  useEffect(() => {
    updateMetrics();

    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateMetrics());
      observer.observe(container);
    }

    window.addEventListener('scroll', updateMetrics);
    window.addEventListener('resize', updateMetrics);

    return () => {
      if (observer && container) {
        observer.unobserve(container);
        observer.disconnect();
      }
      window.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [container, unitId, x1, x2, recalcKey]);

  if (
    y === 0 ||
    size.width === 0 ||
    size.height === 0 ||
    Math.abs(x1 - x2) < 1
  ) {
    return null;
  }

  const from = x1;
  const to = x2;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size.width,   // вся ширина прокручиваемого контента
        height: size.height, // вся высота
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* пунктирная линия */}
      <line
        x1={from}
        y1={y}
        x2={to}
        y2={y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />

      {/* хвостик в начале */}
      <circle
        cx={from}
        cy={y}
        r={3}        
        fill="#706e55ff"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* хвостик в конце */}
      <circle
        cx={to}
        cy={y}
        r={3}
        fill="#706e55ff"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};





// const DottedLine: React.FC<DottedLineProps> = ({
//   container,
//   unitId,
//   x1,
//   x2,
//   stroke = 'gray',
//   strokeWidth = 1,
//   dashArray = '6,5',
//   clippedStart,
//   clippedEnd,
// }) => {
//   const [y, setY] = useState(0);
//   const [size, setSize] = useState({ width: 0, height: 0 });

//   const updateMetrics = () => {
//     if (!container) {
//       setY(0);
//       setSize({ width: 0, height: 0 });
//       return;
//     }

//     const cell = container.querySelector(
//       `[data-unit-id="${unitId}"]`
//     ) as HTMLElement | null;

//     if (!cell) {
//       setY(0);
//       setSize({
//         width: container.scrollWidth || container.clientWidth,
//         height: container.scrollHeight || container.clientHeight,
//       });
//       return;
//     }

//     const containerRect = container.getBoundingClientRect();
//     const rect = cell.getBoundingClientRect();
//     const Y_OFFSET = 6; // сдвиг линии по вертикали
//     const yCenter = rect.top + rect.height / 2 - containerRect.top + Y_OFFSET;

//     setY(yCenter);
//     setSize({
//       width: container.scrollWidth || container.clientWidth,
//       height: container.scrollHeight || container.clientHeight,
//     });
//   };

//   useEffect(() => {
//     updateMetrics();

//     let observer: ResizeObserver | null = null;
//     if (container && typeof ResizeObserver !== 'undefined') {
//       observer = new ResizeObserver(() => updateMetrics());
//       observer.observe(container);
//     }

//     window.addEventListener('scroll', updateMetrics);
//     window.addEventListener('resize', updateMetrics);

//     return () => {
//       if (observer && container) {
//         observer.unobserve(container);
//         observer.disconnect();
//       }
//       window.removeEventListener('scroll', updateMetrics);
//       window.removeEventListener('resize', updateMetrics);
//     };
//   }, [container, unitId]);

//   // если не знаем координат или длина линии почти нулевая — не рисуем
//   if (
//     y === 0 ||
//     size.width === 0 ||
//     size.height === 0 ||
//     Math.abs(x1 - x2) < 1
//   ) {
//     return null;
//   }

//   const from = x1;
//   const to = x2;

//   return (
//     <svg
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         width: size.width,   // <-- ВЕСЬ scrollWidth
//         height: size.height, // <-- ВЕСЬ scrollHeight
//         pointerEvents: 'none',
//         zIndex: 10,
//       }}
//     >
//       <line
//         x1={from}
//         y1={y}
//         x2={to}
//         y2={y}
//         stroke={stroke}
//         strokeWidth={strokeWidth}
//         strokeDasharray={dashArray}
//       />

//       {clippedStart && (
//         <circle
//           cx={x1}
//           cy={y}
//           r={4}
//           stroke={stroke}
//           strokeWidth={strokeWidth}
//           fill="white"
//         />
//       )}

//       {clippedEnd && (
//         <circle
//           cx={x2}
//           cy={y}
//           r={4}
//           stroke={stroke}
//           strokeWidth={strokeWidth}
//           fill="white"
//         />
//       )}
//     </svg>
//   );
// };



// const DottedLine: React.FC<DottedLineProps> = ({
//   container,
//   unitId,
//   x1,
//   x2,
//   stroke = 'gray',
//   strokeWidth = 1,
//   dashArray = '6,5',
// }) => {
//   const [y, setY] = useState(0);

//   const updateY = () => {
//     if (!container) {
//       setY(0);
//       return;
//     }

//     const cell = container.querySelector(
//       `[data-unit-id="${unitId}"]`
//     ) as HTMLElement | null;

//     if (!cell) {
//       setY(0);
//       return;
//     }
    

//     const containerRect = container.getBoundingClientRect();
//     const rect = cell.getBoundingClientRect();
//     const Y_OFFSET = 6; // сдвиг линии по вертикали
//     const yCenter = rect.top + rect.height / 2 - containerRect.top + Y_OFFSET;
//     setY(yCenter);
//   };

//   useEffect(() => {
//     updateY();

//     let observer: ResizeObserver | null = null;
//     if (container && typeof ResizeObserver !== 'undefined') {
//       observer = new ResizeObserver(() => updateY());
//       observer.observe(container);
//     }

//     window.addEventListener('scroll', updateY);
//     window.addEventListener('resize', updateY);

//     return () => {
//       if (observer && container) {
//         observer.unobserve(container);
//         observer.disconnect();
//       }
//       window.removeEventListener('scroll', updateY);
//       window.removeEventListener('resize', updateY);
//     };
//   }, [container, unitId]);

//   if (y === 0 || x1 === x2) return null;

//   const from = Math.min(x1, x2);
//   const to = Math.max(x1, x2);

//   return (
//     <svg
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         width: '100%',   // вся ширина плюс-контейнера (дни * dayWidth)
//         height: '100%',
//         pointerEvents: 'none',
//         zIndex: 10,
//       }}
//     >
//       <line
//         x1={from}
//         y1={y}
//         x2={to}
//         y2={y}
//         stroke={stroke}
//         strokeWidth={strokeWidth}
//         strokeDasharray={dashArray}
//       />
//     </svg>
//   );
// };

export default DottedLine;
