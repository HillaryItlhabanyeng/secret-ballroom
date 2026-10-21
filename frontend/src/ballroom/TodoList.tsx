import { useEffect, useState } from 'react';
import * as api from '../api';
import { seal, unseal } from '../crypto/vault';
import type { Session } from '../auth';
import type { ShownTodo } from './types';

type Props = {
  session: Session;
  onError: (e: unknown) => void;
};

export function TodoList({ session, onError }: Props) {
  const [todos, setTodos] = useState<ShownTodo[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await api.listTodos(session.token);
        const opened = await Promise.all(rows.map(async (row) => ({
          id: row.id,
          done: row.done,
          position: row.position,
          text: await unseal<{ text: string }>(session.key, 'todo', row).then((v) => v.text).catch(() => null),
        })));
        if (!cancelled) setTodos(opened);
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

  async function add() {
    const value = text.trim();
    if (!value) return;
    setText('');
    try {
      const sealed = await seal(session.key, 'todo', { text: value });
      const row = await api.createTodo(session.token, sealed);
      setTodos((prev) => [...prev, { id: row.id, done: row.done, position: row.position, text: value }]);
    } catch (e) {
      setText(value); // give the text back so nothing is lost
      onError(e);
    }
  }

  // Optimistic: tick it on screen straight away, and undo if the server says no
  async function toggle(todo: ShownTodo) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !todo.done } : t)));
    try {
      await api.updateTodo(session.token, todo.id, { done: !todo.done });
    } catch (e) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t)));
      onError(e);
    }
  }

  async function remove(id: number) {
    const before = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTodo(session.token, id);
    } catch (e) {
      setTodos(before);
      onError(e);
    }
  }

  const left = todos.filter((t) => !t.done).length;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>To-dos</h2>
        <span className="muted small">{left} left</span>
      </header>

      <form
        className="todo-form"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input className="todo-input" placeholder="Add a little task..." value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        <button className="btn small" type="submit" disabled={!text.trim()}>Add</button>
      </form>

      <ul className="todos">
        {loading && <li className="muted">Gathering your tasks...</li>}
        {!loading && todos.length === 0 && <li className="muted">Nothing to do. Time to dance 💃</li>}
        {todos.map((t) => (
          <li key={t.id} className={t.done ? 'todo done' : 'todo'}>
            <button className="check" onClick={() => toggle(t)} aria-label={t.done ? 'Mark as not done' : 'Mark as done'}>
              {t.done ? '✓' : ''}
            </button>
            <span className="todo-text">{t.text ?? "🔒 Couldn't be opened"}</span>
            <button className="remove" onClick={() => remove(t.id)} aria-label="Delete task">×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}