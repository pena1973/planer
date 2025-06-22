

import { useRef } from "react";

export const useDropTargetDate = (days: TimelineDay[], containerRef: React.RefObject<HTMLElement>) => {
  const offsetXRef = useRef(0);

  const onDragStart = (e: React.DragEvent<HTMLElement>, elementRef: React.RefObject<HTMLElement>) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    offsetXRef.current = e.clientX - rect.left;
  };

  const getDropDate = (e: React.DragEvent<HTMLElement>): Date | null => {
    if (!containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const leftX = e.clientX - offsetXRef.current;
    const relativeX = leftX - containerRect.left + containerRef.current.scrollLeft;

    for (let day of days) {
      if (relativeX >= day.left && relativeX < day.left + day.width) {
        return day.startDate;
      }
    }

    return null; // не попали ни в один день
  };

  return { onDragStart, getDropDate };
};
