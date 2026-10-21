import { useCallback, useRef, useState } from 'react';
import { MAX_GAP_MS, MAX_STEPS, MIN_GAP_MS, MIN_STEPS, type Dance } from './types';

const EMPTY: Dance = { steps: [], rhythmMs: [] };

export function useDanceRecorder() {
  const data = useRef<Dance>(EMPTY);
  const lastAt = useRef<number | null>(null);
  const [dance, setDance] = useState<Dance>(EMPTY);
  const [restarted, setRestarted] = useState(false);

  const step = useCallback((stone: number) => {
    const now = performance.now(); // precise timer, not affected by clock changes
    const current = data.current;
    if (current.steps.length >= MAX_STEPS) return;

    let next: Dance;
    if (lastAt.current === null) {
      next = { steps: [stone], rhythmMs: [] };
    } else {
      const gap = Math.round(now - lastAt.current);
      if (gap < MIN_GAP_MS) return; // ignore accidental double taps

      if (gap > MAX_GAP_MS) {
        next = { steps: [stone], rhythmMs: [] }; // paused too long: start again from this step
        setRestarted(true);
      } else {
        next = { steps: [...current.steps, stone], rhythmMs: [...current.rhythmMs, gap] };
        setRestarted(false);
      }
    }

    data.current = next;
    lastAt.current = now;
    setDance(next);
  }, []);

  const reset = useCallback(() => {
    data.current = EMPTY;
    lastAt.current = null;
    setDance(EMPTY);
    setRestarted(false);
  }, []);

  return {
    dance,
    step,
    reset,
    restarted,
    isReady: dance.steps.length >= MIN_STEPS,
    isFull: dance.steps.length >= MAX_STEPS,
  };
}