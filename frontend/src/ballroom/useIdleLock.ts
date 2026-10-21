import { useEffect, useRef } from 'react';

const IDLE_MS = 10 * 60 * 1000;      // 10 quiet minutes while open
const BACKGROUND_MS = 2 * 60 * 1000; // 2 minutes in the background (switched apps, phone locked)

export function useIdleLock(expiresAt: string, onLock: (reason: string) => void) {
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  });

  useEffect(() => {
    const lock = (reason: string) => onLockRef.current(reason);
    const lockForIdle = () => lock('The ballroom locked itself after 10 quiet minutes.');

    let idleTimer = window.setTimeout(lockForIdle, IDLE_MS);
    const resetIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(lockForIdle, IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));

    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null && Date.now() - hiddenAt > BACKGROUND_MS) {
        lock('The ballroom locked itself while you were away.');
      } else {
        hiddenAt = null;
        resetIdle();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const msLeft = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const expiryTimer = window.setTimeout(
      () => lock('Your hour in the ballroom is over. Dance in again to continue.'),
      msLeft,
    );

    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(expiryTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [expiresAt]);
}