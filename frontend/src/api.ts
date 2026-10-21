import type { Sealed } from './crypto/vault';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8082/api';

export const wake = () => fetch(`${API}/health`).catch(() => undefined);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type EntryDto = Sealed & { id: number; createdAt: string; updatedAt: string };
export type TodoDto = Sealed & { id: number; done: boolean; position: number; createdAt: string };
export type LoginResponse = { token: string; username: string; expiresAt: string; wrappedKey: string };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // no JSON body, keep the default message
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const user = (username: string) => encodeURIComponent(username);

// ---- dancers and sessions ----
export const getSalt = (username: string) => request<{ kdfSalt: string }>(`/dancers/${user(username)}/salt`);
export const getRecoverySalt = (username: string) =>
  request<{ recoverySalt: string }>(`/dancers/${user(username)}/recovery-salt`);

export const register = (body: {
  username: string;
  authKey: string;
  kdfSalt: string;
  rhythmMs: number[];
  wrappedKey: string;
  recoverySalt: string;
  recoveryAuthKey: string;
  recoveryWrappedKey: string;
}) => request<{ id: number; username: string }>('/dancers', json('POST', body));

export const login = (body: { username: string; authKey: string; rhythmMs: number[] }) =>
  request<LoginResponse>('/auth/login', json('POST', body));

export const recoverStart = (body: { username: string; recoveryAuthKey: string }) =>
  request<{ recoveryWrappedKey: string }>('/auth/recover/start', json('POST', body));

export const recoverFinish = (body: {
  username: string;
  recoveryAuthKey: string;
  authKey: string;
  kdfSalt: string;
  rhythmMs: number[];
  wrappedKey: string;
}) => request<LoginResponse>('/auth/recover/finish', json('POST', body));

export const logout = (token: string) => request<void>('/auth/logout', { method: 'POST' }, token);

// ---- journal ----
export const listEntries = (token: string) => request<EntryDto[]>('/entries?limit=100', {}, token);
export const createEntry = (token: string, sealed: Sealed) => request<EntryDto>('/entries', json('POST', sealed), token);
export const updateEntry = (token: string, id: number, sealed: Sealed) =>
  request<EntryDto>(`/entries/${id}`, json('PATCH', sealed), token);
export const deleteEntry = (token: string, id: number) => request<void>(`/entries/${id}`, { method: 'DELETE' }, token);

// ---- to-dos ----
export const listTodos = (token: string) => request<TodoDto[]>('/todos', {}, token);
export const createTodo = (token: string, sealed: Sealed) => request<TodoDto>('/todos', json('POST', sealed), token);
export const updateTodo = (token: string, id: number, change: Partial<Sealed> & { done?: boolean }) =>
  request<TodoDto>(`/todos/${id}`, json('PATCH', change), token);
export const deleteTodo = (token: string, id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' }, token);