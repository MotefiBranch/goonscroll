import { useEffect, useRef } from 'react';

interface UseGesturesOptions {
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useGestures({
  onSwipeUp,
  onSwipeDown,
  threshold = 40,
  disabled = false,
}: UseGesturesOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const lastWheelTime = useRef<number>(0);

  useEffect(() => {
    if (disabled) return;

    // 1. Touch Events (Mobile Safari / Chrome)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isScrolling.current = false;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;

      const deltaY = touchEndY - touchStartY.current;
      const deltaX = touchEndX - touchStartX.current;

      // Only trigger if vertical swipe is dominant and exceeds threshold
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
        if (deltaY < 0) {
          // Swiped up -> next post
          onSwipeUp();
        } else {
          // Swiped down -> prev post
          onSwipeDown();
        }
      }

      touchStartY.current = null;
      touchStartX.current = null;
    };

    // 2. Mouse Wheel Navigation (Desktop)
    const handleWheel = (e: WheelEvent) => {
      // Allow normal scroll inside modals or drawers
      const target = e.target as HTMLElement;
      if (target.closest('.scrollable-area') || target.closest('[role="dialog"]')) {
        return;
      }

      e.preventDefault();
      const now = Date.now();
      // Throttle wheel swipes so one tick doesn't skip 10 posts
      if (now - lastWheelTime.current < 450) return;

      if (Math.abs(e.deltaY) > 20) {
        lastWheelTime.current = now;
        if (e.deltaY > 0) {
          onSwipeUp();
        } else {
          onSwipeDown();
        }
      }
    };

    // 3. Keyboard Arrow Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        onSwipeUp();
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        onSwipeDown();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSwipeUp, onSwipeDown, threshold, disabled]);
}
