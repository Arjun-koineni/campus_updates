'use client';

import { useEffect } from 'react';

/**
 * Custom hook that observes elements with `.scroll-reveal` and `.scroll-zoom`
 * classes, adding `.visible` when they enter the viewport.
 * Uses MutationObserver so asynchronously loaded posts and pages are automatically animated.
 */
export function useScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '50px',
      }
    );

    const scanAndObserve = () => {
      const elements = document.querySelectorAll('.scroll-reveal:not(.visible), .scroll-zoom:not(.visible)');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -50) {
          el.classList.add('visible');
        } else {
          observer.observe(el);
        }
      });
    };

    scanAndObserve();

    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
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
