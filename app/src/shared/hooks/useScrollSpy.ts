import { useEffect, useRef } from 'react';

export function useScrollSpy(
  sectionIds: readonly string[],
  onEnter: (sectionId: string) => void,
  threshold = 0.4,
): void {
  const callbackRef = useRef(onEnter);
  useEffect(() => {
    callbackRef.current = onEnter;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el === null) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const sectionId = (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          }
        },
        { threshold },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [sectionIds, threshold]);
}
