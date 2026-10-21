import { useState } from 'react';

type Props = {
  code: string;
  onDone: () => void;
};

export function RecoveryCodeCard({ code, onDone }: Props) {
  const [saved, setSaved] = useState(false);

  return (
    <main className="lock">
      <section className="card">
        <h1>Your recovery code</h1>
        <p className="subtitle">If you ever forget your dance, this is the only other way in.</p>

        <p className="recovery-code">{code}</p>

        <ul className="recovery-tips">
          <li>Write it on paper and keep it somewhere safe 📝</li>
          <li>It will never be shown again</li>
          <li>Anyone with this code and your name could open your journal</li>
        </ul>

        <label className="confirm-line">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          I've written it down somewhere safe
        </label>

        <button className="btn primary block" disabled={!saved} onClick={onDone}>Enter my ballroom</button>
      </section>
    </main>
  );
}