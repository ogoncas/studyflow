// Roda antes da primeira pintura; fica em arquivo próprio por causa da CSP

// Clickjacking: dentro de um <iframe> de outro site, a página some (a CSP em <meta> não aceita frame-ancestors)
if (window.top !== window.self) document.documentElement.style.display = 'none';

// HTTPS obrigatório: fora de localhost, troca http por https
if (location.protocol === 'http:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  location.replace('https:' + location.href.slice(5));
}

// Tema (evita piscar)
try {
  document.documentElement.dataset.theme = localStorage.getItem('studyflow-theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
} catch (e) {}

// Preferências visuais: aplicadas aqui para não piscar e reaplicadas por js/prefs.js quando mudam.
// As listas devem ser iguais às de js/prefs.js (tudo é validado antes de ir para o DOM).
window.applyStudyflowPrefs = function () {
  let p = {};
  try { p = JSON.parse(localStorage.getItem('studyflow-prefs')) || {}; } catch (e) {}
  const root = document.documentElement;
  const pick = (v, list, d) => list.includes(v) ? v : d;
  root.dataset.fs = pick(p.fontSize, ['s', 'm', 'l'], 'm');
  root.dataset.font = pick(p.font, ['sans', 'serif', 'mono'], 'sans');
  root.dataset.radius = pick(p.radius, ['sharp', 'round', 'pill'], 'round');
  root.dataset.motion = pick(p.motion, ['on', 'off'], 'on');
  root.dataset.nav = pick(p.nav, ['full', 'compact'], 'full');
  root.dataset.side = pick(p.side, ['left', 'right'], 'left');
  root.dataset.width = pick(p.width, ['narrow', 'normal', 'wide'], 'normal');
  root.dataset.density = pick(p.density, ['comfy', 'compact'], 'comfy');

  // Cor de destaque: define --ac e a cor do texto sobre ela (claro e escuro) com contraste suficiente
  const hex = /^#[0-9a-f]{6}$/i.test(p.accent) ? p.accent : null;
  if (!hex || hex.toLowerCase() === '#5b6cff') {
    ['--ac', '--on-ac', '--on-ac-dk'].forEach(k => root.style.removeProperty(k));
    return;
  }
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const lum = c => {
    const [r, g, b] = c.map(v => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const onColor = c => lum(c) <= 0.1925 ? '#ffffff' : '#10131c';
  root.style.setProperty('--ac', hex);
  root.style.setProperty('--on-ac', onColor(rgb));
  root.style.setProperty('--on-ac-dk', onColor(rgb.map(v => v * 0.65 + 255 * 0.35)));
};
window.applyStudyflowPrefs();
