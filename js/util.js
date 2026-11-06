import { t, locale } from './i18n.js';

export const $ = s => document.querySelector(s);

// Ponte entre módulos: app.js preenche com as funções reais (evita importações circulares)
export const app = { render() {}, go() {} };

export const VIEWS = ['dashboard', 'schedule', 'calendar', 'notes', 'subjects'];
// Os tipos são guardados em português nos dados; só o rótulo é traduzido
export const TYPES = ['Prova', 'Trabalho', 'Evento'];
export const TYPE_COLORS = { Prova: '#e5484d', Trabalho: '#f59e0b', Evento: '#10b981' };

// Tudo que vem do armazenamento (ou de um backup) passa por esc/safeColor/typeOf antes de ir ao HTML
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
export const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#888';
export const typeOf = x => TYPES.includes(x) ? x : 'Evento';
export const typeLabel = x => t('type.' + typeOf(x));
export const options = (list, sel) => list.map(o => `<option value="${esc(o[0])}"${o[0] === sel ? ' selected' : ''}>${esc(o[1])}</option>`).join('');
export const byId = list => new Map(list.map(x => [x.id, x]));

/* ===== Formatadores Intl (criar um é caro: ficam em cache por idioma) ===== */
let cacheLoc;
const cache = new Map();
const memo = (key, make) => {
  if (cacheLoc !== locale()) {
    cache.clear();
    cacheLoc = locale();
  }
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};
const dtf = (key, opts) => memo(key, () => new Intl.DateTimeFormat(locale(), opts));

export const cap = s => s[0].toUpperCase() + s.slice(1);
export const dayName = i => memo('day' + i, () => cap(dtf('wd', { weekday: 'long' }).format(new Date(2023, 0, 1 + i))));
export const dayShort = i => dayName(i).slice(0, 3);
export const monthLabel = d => cap(dtf('my', { month: 'long', year: 'numeric' }).format(d));
export const dayMonthLong = d => dtf('dml', { day: 'numeric', month: 'long' }).format(d);
export const fullStamp = ts => dtf('full', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(ts);
export const fmtDate = iso => dtf('dm', { day: '2-digit', month: '2-digit' }).format(new Date(iso + 'T00:00'));

const SV = new Intl.DateTimeFormat('sv');
export const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
export const todayISO = () => SV.format(new Date());
export const daysUntil = iso => Math.round((new Date(iso + 'T00:00') - new Date(todayISO() + 'T00:00')) / 864e5);
export const inDays = n => n === 0 ? t('when.today') : n === 1 ? t('when.tomorrow') : t('when.days', { n });
export const greet = () => {
  const h = new Date().getHours();
  return t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening');
};

// Tempo relativo no idioma atual; passada uma semana, mostra a data
export const ago = ts => {
  const diff = (ts - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = memo('rtf', () => new Intl.RelativeTimeFormat(locale(), { numeric: 'auto', style: 'short' }));
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
  const sameYear = new Date(ts).getFullYear() === new Date().getFullYear();
  return dtf(sameYear ? 'dmShort' : 'dmyShort', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(ts);
};

export const byStart = (a, b) => a.start.localeCompare(b.start);
export const avg = s => {
  const n = (s || '').split(/[;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => !isNaN(x));
  return n.length ? (n.reduce((a, b) => a + b) / n.length).toFixed(1) : '—';
};
