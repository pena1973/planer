import { useEffect, useRef } from 'react';

export const useResizeObserver = (
  ref: React.RefObject<HTMLElement>,
  onResize: () => void,
  delay = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onResize();
      }, delay);
    });

    observer.observe(ref.current);

    // вызов сразу
    onResize();

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ref, onResize, delay]);
};
