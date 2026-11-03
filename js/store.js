// Armazenamento local (localStorage)
const KEY = 'studyflow-local';

export const COLS = ['subjects', 'events', 'notes', 'schedule'];
export const state = { subjects: [], events: [], notes: [], schedule: [] };
export const newId = () => crypto.randomUUID();

const persist = () => localStorage.setItem(KEY, JSON.stringify(state));

export async function init() {
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {}
  COLS.forEach(c => state[c] = data[c] || []);
}

export async function save(col, item) {
  const i = state[col].findIndex(x => x.id === item.id);
  if (i >= 0) state[col][i] = item;
  else state[col].push(item);
  persist();
}

export async function remove(col, id) {
  state[col] = state[col].filter(x => x.id !== id);
  persist();
}
