import { useState } from 'react';
import { LockScreen } from './LockScreen';
import { Ballroom } from './ballroom/Ballroom';
import type { Session } from './auth';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <div className="sky" aria-hidden="true" />
      {session ? (
        <Ballroom
          session={session}
          onLeave={(msg) => {
            setNotice(msg ?? null);
            setSession(null);
          }}
        />
      ) : (
        <LockScreen
          notice={notice}
          onEnter={(s) => {
            setNotice(null);
            setSession(s);
          }}
        />
      )}
    </>
  );
}