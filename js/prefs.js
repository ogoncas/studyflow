import { ic } from './icons.js';
import { esc, VIEWS } from './util.js';

const KEY = 'studyflow-prefs';

export const ACCENTS = ['#5b6cff', '#7c3aed', '#db2777', '#e5484d', '#f97316', '#d4a000', '#10b981', '#0ea5e9'];

// Valores aceitos por opção (iguais aos de js/boot.js)
export const OPTIONS = {
  fontSize: ['s', 'm', 'l'],
  font: ['sans', 'serif', 'mono'],
  radius: ['sharp', 'round', 'pill'],
  motion: ['on', 'off'],
  nav: ['full', 'compact'],
  side: ['left', 'right'],
  width: ['narrow', 'normal', 'wide'],
  density: ['comfy', 'compact'],
  weekStart: [0, 1],
  home: VIEWS
};

export const DEFAULTS = {
  name: '', bio: '', photo: '', accent: ACCENTS[0],
  fontSize: 'm', font: 'sans', radius: 'round', motion: 'on',
  nav: 'full', side: 'left', width: 'normal', density: 'comfy', weekStart: 0, home: 'dashboard'
};

const MAX_PHOTO = 150000; // caracteres da data URL (~110 KB)
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// Normaliza qualquer entrada (armazenamento, backup, interface): só campos e valores conhecidos
export function clean(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const out = { ...DEFAULTS };
  out.name = typeof p.name === 'string' ? p.name.trim().slice(0, 40) : '';
  out.bio = typeof p.bio === 'string' ? p.bio.trim().slice(0, 60) : '';
  out.photo = typeof p.photo === 'string' && p.photo.length <= MAX_PHOTO && PHOTO_RE.test(p.photo) ? p.photo : '';
  out.accent = typeof p.accent === 'string' && /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent.toLowerCase() : DEFAULTS.accent;
  for (const k of Object.keys(OPTIONS)) if (OPTIONS[k].includes(p[k])) out[k] = p[k];
  return out;
}

const read = () => {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return clean(null);
  }
};

let prefs = read();
const listeners = [];

const applyPhoto = () => {
  const root = document.documentElement.style;
  if (prefs.photo) root.setProperty('--photo', `url("${prefs.photo}")`);
  else root.removeProperty('--photo');
};

const apply = () => {
  window.applyStudyflowPrefs?.();
  applyPhoto();
  listeners.forEach(fn => fn());
};

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    window.dispatchEvent(new Event('studyflow:error'));
  }
};

export const getPrefs = () => prefs;
export const onPrefs = fn => listeners.push(fn);
export const exportPrefs = () => prefs;

export function setPrefs(patch) {
  prefs = clean({ ...prefs, ...patch });
  persist();
  apply();
}

// Restaura só a aparência e o layout; nome e foto ficam
export const resetLook = () => {
  const { name, bio, photo } = prefs;
  setPrefs({ ...DEFAULTS, name, bio, photo });
};

export function importPrefs(raw) {
  if (!raw || typeof raw !== 'object') return;
  prefs = clean(raw);
  persist();
  apply();
}

export const initPrefs = () => applyPhoto();

// Outra aba mudou as preferências
window.addEventListener('storage', e => {
  if (e.key !== KEY && e.key !== null) return;
  prefs = read();
  apply();
});

/* ===== Foto de perfil ===== */

// Recorta o centro em quadrado, reduz para 256 px e comprime em JPEG
export async function processPhoto(file) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) throw new Error('photo');
  const bmp = await createImageBitmap(file);
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, S, S);
  const side = Math.min(bmp.width, bmp.height);
  g.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, S, S);
  bmp.close?.();
  let q = 0.85;
  let url = canvas.toDataURL('image/jpeg', q);
  while (url.length > MAX_PHOTO && q > 0.3) url = canvas.toDataURL('image/jpeg', (q -= 0.1));
  if (url.length > MAX_PHOTO) throw new Error('photo');
  return url;
}

const initials = name => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = w => w.match(/\p{L}/u)?.[0] || '';
  return (first(words[0] || '') + (words.length > 1 ? first(words.at(-1)) : '')).toUpperCase();
};

// Avatar do usuário: foto (via variável CSS, sem repetir a imagem no HTML), iniciais ou ícone
export function avatarHtml() {
  const { photo, name } = prefs;
  if (photo) return `<div class="avatar has-photo" role="img" aria-label="${esc(name)}"></div>`;
  const ini = initials(name);
  return `<div class="avatar">${ini ? `<span>${esc(ini)}</span>` : ic('book')}</div>`;
}
