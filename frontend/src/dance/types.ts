export type Dance = {
  steps: number[];    // which stones, 0 to 8
  rhythmMs: number[]; // gaps between steps in milliseconds
};

export const MIN_STEPS = 6;
export const MAX_STEPS = 12;
export const MIN_GAP_MS = 80;    // faster than this is an accidental double tap
export const MAX_GAP_MS = 3000;  // slower than this restarts the dance