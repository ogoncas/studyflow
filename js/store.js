// Armazenamento local (localStorage)
const KEY = 'studyflow-local';

export const COLS = ['subjects', 'events', 'notes', 'schedule'];
export const state = { subjects: [], events: [], notes: [], schedule: [] };
export const newId = () => crypto.randomUUID();

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    window.dispatchEvent(new Event('studyflow:error'));
  }
};

// Carrega só listas de objetos com id; ignora o resto
const load = data => COLS.forEach(c => {
  const list = data?.[c];
  state[c] = Array.isArray(list) ? list.filter(x => x && typeof x.id === 'string') : [];
});

export async function init() {
  let data;
  try {
    data = JSON.parse(localStorage.getItem(KEY));
  } catch {}
  load(data);
  // Pede ao navegador para não apagar os dados sob pressão de espaço
  navigator.storage?.persist?.().catch(() => {});
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

export const exportData = () =>
  JSON.stringify({ app: 'studyflow', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);

export function importData(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!COLS.some(c => Array.isArray(data?.[c]))) throw new Error('Arquivo de backup inválido.');
  load(data);
  persist();
}
