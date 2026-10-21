import { useCallback, useEffect, useRef, useState } from 'react';

const KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];

type Props = {
  onStep: (stone: number) => void;
  disabled?: boolean;
};

export function DanceFloor({ onStep, disabled = false }: Props) {
  const [pulse, setPulse] = useState<{ stone: number; n: number } | null>(null);
  const counter = useRef(0);

  const press = useCallback((stone: number) => {
    if (disabled) return;
    counter.current += 1;
    setPulse({ stone, n: counter.current }); // new key restarts the glow animation
    onStep(stone);
  }, [disabled, onStep]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return; // holding a key down is not dancing
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return; // typing your name isn't dancing
      const stone = KEYS.indexOf(e.key.toLowerCase());
      if (stone >= 0) press(stone);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  return (
    <div className="floor-wrap">
      <div className="floor">
        {KEYS.map((key, stone) => (
          <button
            key={key}
            type="button"
            className="stone"
            disabled={disabled}
            aria-label={`Stone ${stone + 1}`}
            onPointerDown={() => press(stone)} // fires on touch, not release: more accurate rhythm
          >
            {pulse?.stone === stone && <span key={pulse.n} className="ripple" />}
            <span className="key-hint">{key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}