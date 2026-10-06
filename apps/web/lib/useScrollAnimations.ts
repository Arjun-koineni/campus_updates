'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom hook that observes elements with `.scroll-reveal` and `.scroll-zoom`
 * classes, adding `.visible` when they enter the viewport.
 * Also handles staggered children automatically.
 */
export function useScrollAnimations() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = document.querySelectorAll('.scroll-reveal, .scroll-zoom');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
}

/**
 * Utility to assign stagger classes to an index.
 * Returns a className like "stagger-1", "stagger-2", etc.
 */
export function staggerClass(index: number): string {
  return `stagger-${Math.min(index + 1, 8)}`;
}
