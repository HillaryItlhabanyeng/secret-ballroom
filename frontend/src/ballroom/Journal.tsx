import { useEffect, useState } from 'react';
import * as api from '../api';
import { seal, unseal } from '../crypto/vault';
import type { Session } from '../auth';
import { MOODS, type Entry, type ShownEntry } from './types';

const EMPTY: Entry = { title: '', body: '', mood: '✨' };

async function openRow(key: CryptoKey, row: api.EntryDto): Promise<ShownEntry> {
  const entry = await unseal<Entry>(key, 'entry', row).catch(() => null);
  return { id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt, entry };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

type Props = {
  session: Session;
  onError: (e: unknown) => void;
};

export function Journal({ session, onError }: Props) {
  const [entries, setEntries] = useState<ShownEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | 'new'>('new');
  const [draft, setDraft] = useState<Entry>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api.listEntries(session.token);
        const opened = await Promise.all(rows.map((row) => openRow(session.key, row)));
        if (!cancelled) setEntries(opened);
      } catch (e) {
        if (!cancelled) onError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, onError]);

  const selected = entries.find((e) => e.id === selectedId);
  const isLocked = selected !== undefined && selected.entry === null;
  const isEmpty = !draft.title.trim() && !draft.body.trim();

  function select(e: ShownEntry) {
    setSelectedId(e.id);
    setDraft(e.entry ?? EMPTY);
    setConfirmDelete(false);
    setSavedAt(null);
  }

  function newEntry() {
    setSelectedId('new');
    setDraft(EMPTY);
    setConfirmDelete(false);
    setSavedAt(null);
  }

  async function save() {
    if (isEmpty || saving) return;
    setSaving(true);
    try {
      const clean: Entry = { title: draft.title.trim() || 'Untitled', body: draft.body, mood: draft.mood };
      const sealed = await seal(session.key, 'entry', clean); // fresh IV every save

      if (selectedId === 'new') {
        const row = await api.createEntry(session.token, sealed);
        setEntries((prev) => [{ id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt, entry: clean }, ...prev]);
        setSelectedId(row.id);
      } else {
        const row = await api.updateEntry(session.token, selectedId, sealed);
        setEntries((prev) => prev.map((e) => (e.id === row.id ? { ...e, updatedAt: row.updatedAt, entry: clean } : e)));
      }
      setDraft(clean);
      setSavedAt(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (selectedId === 'new') return;
    if (!confirmDelete) {
      setConfirmDelete(true); // ask once more before deleting
      return;
    }
    try {
      await api.deleteEntry(session.token, selectedId);
      setEntries((prev) => prev.filter((e) => e.id !== selectedId));
      newEntry();
    } catch (e) {
      onError(e);
    }
  }

  return (
    <section className="panel journal">
      <header className="panel-head">
        <h2>Journal</h2>
        <button className="btn small" onClick={newEntry}>+ New page</button>
      </header>

      <div className="journal-body">
        <ul className="entry-list">
          {loading && <li className="muted">Opening your pages...</li>}
          {!loading && entries.length === 0 && <li className="muted">No pages yet. Write your first one ✨</li>}
          {entries.map((e) => (
            <li key={e.id}>
              <button className={selectedId === e.id ? 'entry-item active' : 'entry-item'} onClick={() => select(e)}>
                <span className="entry-mood">{e.entry?.mood ?? '🔒'}</span>
                <span className="entry-text">
                  <strong>{e.entry?.title ?? "Couldn't be opened"}</strong>
                  <small>{formatDate(e.createdAt)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="editor">
          {isLocked ? (
            <div className="locked-note">
              🔒 This page couldn't be opened. It was changed outside the ballroom, or sealed with a different dance.
            </div>
          ) : (
            <>
              <div className="moods">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    className={draft.mood === m ? 'mood active' : 'mood'}
                    onClick={() => setDraft((d) => ({ ...d, mood: m }))}
                    aria-label={`Mood ${m}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                className="title-input"
                placeholder="Title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
              <textarea
                className="body-input"
                placeholder="Dear diary..."
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </>
          )}

          <div className="editor-actions">
            {selectedId !== 'new' && (
              <button className={confirmDelete ? 'btn danger' : 'btn ghost'} onClick={remove}>
                {confirmDelete ? 'Tap again to delete' : 'Delete'}
              </button>
            )}
            <span className="muted small">{savedAt ? `Sealed at ${savedAt}` : ''}</span>
            {!isLocked && (
              <button className="btn primary" onClick={save} disabled={saving || isEmpty}>
                {saving ? 'Sealing...' : 'Seal page'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}