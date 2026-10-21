export type Entry = { title: string; body: string; mood: string };

export type ShownEntry = {
  id: number;
  createdAt: string;
  updatedAt: string;
  entry: Entry | null; // null = couldn't be opened (tampered, or sealed with another dance)
};

export type ShownTodo = {
  id: number;
  done: boolean;
  position: number;
  text: string | null;
};

export const MOODS = ['✨', '🌙', '🌸', '💜', '🌧️', '🔥'];