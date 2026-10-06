'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook providing page transitions with a branded slide + translate overlay.
 * Returns { navigateTo, TransitionOverlay }.
 * Usage:
 *   const { navigateTo, TransitionOverlay } = usePageTransition();
 *   <TransitionOverlay />
 *   <a onClick={() => navigateTo('/dashboard')}>Go</a>
 */
export function usePageTransition() {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateTo = useCallback((href: string) => {
    if (phase !== 'idle') return;

    // Phase 1: Show overlay with brand sweep-in
    setPhase('entering');

    timeoutRef.current = setTimeout(() => {
      // Navigate during the overlay
      startTransition(() => {
        router.push(href);
      });

      // Phase 2: After a brief hold, sweep out
      setTimeout(() => {
        setPhase('exiting');
        setTimeout(() => {
          setPhase('idle');
        }, 450);
      }, 250);
    }, 500);
  }, [phase, router, startTransition]);

  const TransitionOverlay = useCallback(() => {
    if (phase === 'idle') return null;
    return (
      <div className={`page-transition-overlay ${phase === 'entering' ? 'active' : 'exiting'}`}>
        <div className="page-transition-bg" />
        <div className="page-transition-brand">
          <div className="transition-icon">✦</div>
          <span className="transition-text">Campus Updates</span>
        </div>
      </div>
    );
  }, [phase]);

  return { navigateTo, TransitionOverlay };
}
