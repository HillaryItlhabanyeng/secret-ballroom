import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api';
import type { Session } from '../auth';
import { DoorsOpening } from './DoorsOpening';
import { Journal } from './Journal';
import { TodoList } from './TodoList';
import { useIdleLock } from './useIdleLock';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

type Props = {
  session: Session;
  onLeave: (notice?: string) => void;
};

export function Ballroom({ session, onLeave }: Props) {
  const [error, setError] = useState<string | null>(null);
  const leaveRef = useRef(onLeave);
  useEffect(() => {
    leaveRef.current = onLeave;
  });

  const lock = useCallback(async (reason?: string) => {
    await api.logout(session.token).catch(() => undefined); // end the session on the server too
    leaveRef.current(reason);
  }, [session.token]);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof api.ApiError && e.status === 401) {
      leaveRef.current('Your session ended. Please dance in again.');
    } else if (e instanceof TypeError) {
      setError("Can't reach the ballroom right now. Check your internet and try again.");
    } else {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }, []);

  useIdleLock(session.expiresAt, lock);

  return (
    <>
      <DoorsOpening />
      <div className="ballroom">
        <header className="ball-head">
          <div>
            <h1>{greeting()}, {session.username}</h1>
            <p className="subtitle">Everything here is sealed with your dance.</p>
          </div>
          <button className="btn ghost lock-btn" onClick={() => lock()}>🔒 Lock</button>
        </header>

        {error && <p className="message error" onClick={() => setError(null)}>{error}</p>}

        <div className="ball-grid">
          <Journal session={session} onError={handleError} />
          <TodoList session={session} onError={handleError} />
        </div>
      </div>
    </>
  );
}