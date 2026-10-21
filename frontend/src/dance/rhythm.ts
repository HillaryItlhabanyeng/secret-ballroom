import type { Dance } from './types';

export function sameDance(a: Dance, b: Dance): boolean {
  if (a.steps.length !== b.steps.length) return false;
  if (a.steps.some((stone, i) => stone !== b.steps[i])) return false;

  return a.rhythmMs.every((gap, i) => {
    const allowed = Math.max(120, gap * 0.3);
    return Math.abs(gap - b.rhythmMs[i]) <= allowed;
  });
}