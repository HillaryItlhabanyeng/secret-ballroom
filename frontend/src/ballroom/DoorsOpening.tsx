import { useEffect, useState } from 'react';

export function DoorsOpening() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div className="doors" aria-hidden="true">
      <div className="glow" />
      <div className="door left" />
      <div className="door right" />
    </div>
  );
}