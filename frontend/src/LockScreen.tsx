import { useEffect, useState } from 'react';
import { DanceFloor } from './dance/DanceFloor';
import { useDanceRecorder } from './dance/useDanceRecorder';
import { sameDance } from './dance/rhythm';
import { MAX_STEPS, MIN_STEPS, type Dance } from './dance/types';
import {
  createBallroom, enterBallroom, finishRecovery, startRecovery,
  type NewBallroom, type RecoveryTicket, type Session,
} from './auth';
import { ApiError, wake } from './api';
import { RecoveryCodeCard } from './RecoveryCodeCard';

type Mode = 'enter' | 'create' | 'recover';
const USERNAME = /^[A-Za-z0-9_]{3,30}$/;

function friendlyError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof TypeError) return "Can't reach the ballroom. If it's been quiet for a while it may be waking up, so try again in a minute.";
  return 'Something went wrong. Please try again.';
}

type Props = {
  onEnter: (session: Session) => void;
  notice?: string | null;
};

export function LockScreen({ onEnter, notice }: Props) {
  const [mode, setMode] = useState<Mode>('enter');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<RecoveryTicket | null>(null);
  const [firstDance, setFirstDance] = useState<Dance | null>(null);
  const [pending, setPending] = useState<NewBallroom | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(notice ?? null);
  const [busy, setBusy] = useState(false);
  const { dance, step, reset, restarted, isReady, isFull } = useDanceRecorder();
    useEffect(() => {
    wake();
  }, []);

  const validName = USERNAME.test(username);
  const askingForCode = mode === 'recover' && ticket === null;
  const choosingNewDance = mode === 'create' || (mode === 'recover' && ticket !== null);
  const confirming = choosingNewDance && firstDance !== null;

  function switchMode(next: Mode) {
    setMode(next);
    setFirstDance(null);
    setTicket(null);
    setCode('');
    setMessage(null);
    setError(null);
    reset();
  }

  async function checkCode() {
    if (!validName || !code.trim() || busy) return;
    setBusy(true);
    setError(null);
    setMessage('Checking your recovery code...');
    try {
      setTicket(await startRecovery(username, code));
      setCode('');
      setMessage('Code accepted 💗 Now choose a new dance.');
    } catch (e) {
      setError(friendlyError(e));
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!isReady || !validName || busy) return;
    const danced = dance;
    reset();
    setError(null);

    if (choosingNewDance && !firstDance) {
      setFirstDance(danced);
      setMessage('Lovely. Now dance it once more to confirm.');
      return;
    }
    if (choosingNewDance && firstDance && !sameDance(firstDance, danced)) {
      setFirstDance(null);
      setMessage(null);
      setError("That wasn't quite the same dance. Let's start again.");
      return;
    }

    setBusy(true);
    setMessage('The floor is listening...');
    try {
      if (mode === 'enter') {
        onEnter(await enterBallroom(username, danced));
      } else if (mode === 'create') {
        setPending(await createBallroom(username, firstDance as Dance, danced));
        setMessage(null);
      } else if (ticket) {
        onEnter(await finishRecovery(ticket, firstDance as Dance, danced));
      }
    } catch (e) {
      setError(friendlyError(e));
      setMessage(null);
      setFirstDance(null);
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return <RecoveryCodeCard code={pending.recoveryCode} onDone={() => onEnter(pending.session)} />;
  }

  const stepsLeft = MIN_STEPS - dance.steps.length;
  let hint = 'Tap the stones, or use Q W E / A S D / Z X C';
  let warn = false;
  if (restarted) {
    hint = 'You paused too long, so your dance began again from that step.';
    warn = true;
  } else if (isFull) {
    hint = `That's the longest dance allowed (${MAX_STEPS} steps).`;
  } else if (dance.steps.length > 0 && stepsLeft > 0) {
    hint = `${stepsLeft} more step${stepsLeft === 1 ? '' : 's'} to go`;
  } else if (isReady) {
    hint = 'Keep dancing, or finish when you are ready.';
  }

  let title = 'Dance to enter';
  if (askingForCode) title = 'Use your recovery code';
  else if (confirming) title = 'Dance it once more';
  else if (mode === 'create') title = 'Choose your secret dance';
  else if (mode === 'recover') title = 'Choose a new dance';
  const action = mode === 'enter' ? 'Enter the ballroom' : confirming ? 'Confirm my dance' : 'Save this dance';

  return (
    <main className="lock">
      <section className="card">
        <h1>Secret Ballroom</h1>
        <p className="subtitle">{title}</p>

        {mode !== 'recover' && (
          <div className="tabs" role="tablist">
            <button className={mode === 'enter' ? 'tab active' : 'tab'} onClick={() => switchMode('enter')} disabled={busy}>Enter</button>
            <button className={mode === 'create' ? 'tab active' : 'tab'} onClick={() => switchMode('create')} disabled={busy}>Create a dance</button>
          </div>
        )}

        <input
          className="name"
          placeholder="Your name (letters, numbers, _ )"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={confirming || busy || ticket !== null}
        />

        {askingForCode ? (
          <>
            <input
              className="name code-input"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
            <div className="actions spaced">
              <button className="btn primary" onClick={checkCode} disabled={!validName || !code.trim() || busy}>Check my code</button>
            </div>
          </>
        ) : (
          <>
            <DanceFloor onStep={step} disabled={!validName || busy} />

            <div className="beats" aria-label={`${dance.steps.length} steps danced`}>
              {Array.from({ length: MAX_STEPS }, (_, i) => (
                <span key={i} className={`beat ${i < dance.steps.length ? 'on' : ''} ${i === MIN_STEPS - 1 ? 'min' : ''}`} />
              ))}
            </div>

            <p className={warn ? 'hint warn' : 'hint'}>{validName ? hint : 'Type your name to wake the dance floor'}</p>

            <div className="actions">
              <button className="btn ghost" onClick={reset} disabled={dance.steps.length === 0 || busy}>Start over</button>
              <button className="btn primary" onClick={finish} disabled={!isReady || !validName || busy}>{action}</button>
            </div>
          </>
        )}

        {message && <p className="message">{message}</p>}
        {error && <p className="message error">{error}</p>}

        {mode === 'recover' ? (
          <button className="link-btn" onClick={() => switchMode('enter')} disabled={busy}>← Back to dancing in</button>
        ) : (
          <button className="link-btn" onClick={() => switchMode('recover')} disabled={busy}>Forgot your dance?</button>
        )}
      </section>
    </main>
  );
}