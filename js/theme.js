import { $ } from './util.js';

const KEY = 'studyflow-theme';
const dark = matchMedia('(prefers-color-scheme:dark)');

export const getThemePref = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
};

// 'auto' segue o tema do sistema
function applyTheme() {
  const pref = getThemePref();
  const isDark = pref === 'dark' || (pref === 'auto' && dark.matches);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = isDark ? '#0f1117' : '#f5f6fa';
}

export function setThemePref(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {}
  applyTheme();
}

export function initTheme() {
  dark.addEventListener('change', applyTheme);
  applyTheme();
}
