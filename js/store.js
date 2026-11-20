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

/* ===== Validação: tudo que entra (armazenamento, backup, formulários) é normalizado ===== */
const MAX_ITEMS = 5000;
const str = (v, max) => typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v).slice(0, max) : '';
const num = v => Number.isFinite(v) ? v : 0;
const time = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T00:00')) ? v : null;
const color = v => /^#[0-9a-f]{6}$/i.test(v) ? v : '#4f6df5';
const TYPES = ['Prova', 'Trabalho', 'Evento'];

// Cada função devolve só os campos conhecidos, ou null se o item não serve
const clean = {
  subjects: x => ({ id: x.id, name: str(x.name, 80), teacher: str(x.teacher, 80), room: str(x.room, 20), color: color(x.color), grades: str(x.grades, 200) }),
  events: x => date(x.date) && { id: x.id, title: str(x.title, 120), date: x.date, type: TYPES.includes(x.type) ? x.type : 'Evento' },
  schedule: x => time(x.start) && time(x.end) && Number.isInteger(+x.day) && +x.day >= 0 && +x.day <= 6 &&
    { id: x.id, day: +x.day, subjectId: str(x.subjectId, 64), start: x.start, end: x.end },
  notes: x => ({ id: x.id, title: str(x.title, 120), body: str(x.body, 5000), subjectId: str(x.subjectId, 64), created: num(x.created), updated: num(x.updated), pinned: x.pinned === true })
};

const valid = x => x && typeof x === 'object' && typeof x.id === 'string' && x.id.length > 0 && x.id.length <= 64;

// Carrega só listas de objetos válidos, sem ids repetidos
const load = data => COLS.forEach(c => {
  const list = Array.isArray(data?.[c]) ? data[c].slice(0, MAX_ITEMS) : [];
  const ids = new Set();
  state[c] = list.filter(x => valid(x) && !ids.has(x.id) && ids.add(x.id)).map(clean[c]).filter(Boolean);
});

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

// Outra aba gravou: recarrega e avisa a interface
window.addEventListener('storage', e => {
  if (e.key !== KEY && e.key !== null) return;
  load(read());
  window.dispatchEvent(new Event('studyflow:sync'));
});

export async function init() {
  load(read());
  // Pede ao navegador para não apagar os dados sob pressão de espaço
  navigator.storage?.persist?.().catch(() => {});
}

export async function save(col, raw) {
  const item = valid(raw) && clean[col](raw);
  if (!item) throw new Error('invalid-item');
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

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function importData(text) {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_BYTES) throw new Error('backup-invalid');
  let data;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!COLS.some(c => Array.isArray(data?.[c]))) throw new Error('backup-invalid');
  load(data);
  persist();
  return data;
}
