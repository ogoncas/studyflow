import { ic, hydrate } from './icons.js';
import { init } from './store.js';
import { t, setLang, getPref, applyStatic } from './i18n.js';
import { $, app, esc, VIEWS } from './util.js';
import { dlg, toast } from './ui.js';
import { initTheme } from './theme.js';
import { initPrefs, onPrefs, getPrefs, avatarHtml } from './prefs.js';
import { openSettings, refreshSettings } from './settings.js';
import { initPwa, onInstallChange } from './pwa.js';
import dashboard from './views/dashboard.js';
import schedule from './views/schedule.js';
import calendar from './views/calendar.js';
import notes from './views/notes.js';
import subjects from './views/subjects.js';

const views = { dashboard, schedule, calendar, notes, subjects };
const view = $('#view');
const navButtons = document.querySelectorAll('#nav nav button');

const initialView = new URLSearchParams(location.search).get('view');
let current = VIEWS.includes(initialView) ? initialView : getPrefs().home;

function render() {
  $('#title').textContent = t('title.' + current);
  navButtons.forEach(b => {
    const on = b.dataset.view === current;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  views[current].draw(view);
}

// Reinicia a animação de entrada (só ao trocar de aba)
const enter = () => {
  view.classList.remove('enter');
  void view.offsetWidth;
  view.classList.add('enter');
};

function go(v) {
  // Já está nesta tela: não redesenha nem repete a animação
  if (v === current) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  views[current].reset?.();
  current = v;
  render();
  enter();
  window.scrollTo(0, 0);
}

// Reaplica o idioma em tudo que já está na tela
function refreshLang() {
  applyStatic();
  renderUser();
  render();
  refreshSettings();
}

// Perfil na barra lateral (desktop) e avatar no cabeçalho (celular)
const renderUser = () => {
  const { name, bio } = getPrefs();
  $('#userBox').innerHTML = `<button type="button" class="me" id="meBtn" aria-label="${t('settings')}" title="${t('settings')}">${avatarHtml()}<span class="me-text"><b>${esc(name) || t('profile.setup')}</b>${bio ? `<small>${esc(bio)}</small>` : ''}</span></button>
    <p class="muted">${ic('drive')} ${t('offlineNote')}</p>`;
  $('#meHdr').innerHTML = `${avatarHtml()}<span class="gear">${ic('settings')}</span>`;
};

Object.assign(app, {
  render,
  go,
  refreshLang,
  reset() {
    views.notes.reset();
    render();
  }
});

/* ===== Eventos (um único ouvinte por tipo; cada tela decide o que fazer) ===== */
for (const type of ['click', 'input', 'change', 'keydown']) {
  view.addEventListener(type, e => views[current][type]?.(e));
}
for (const type of ['touchstart', 'touchend']) {
  view.addEventListener(type, e => views[current][type]?.(e), { passive: true });
}

navButtons.forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
$('#userBox').addEventListener('click', e => e.target.closest('#meBtn') && openSettings('profile'));
$('#meHdr').addEventListener('click', () => openSettings('profile'));

// Itens clicáveis também respondem a Enter e Espaço
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) {
    e.preventDefault();
    e.target.click();
  }
});

// No modo automático, acompanha mudanças de idioma do navegador
window.addEventListener('languagechange', () => {
  if (getPref() !== 'auto') return;
  setLang('auto');
  refreshLang();
});

window.addEventListener('studyflow:error', () => toast(t('err.save'), { icon: 'alert' }));

// Outra aba alterou os dados: redesenha, sem atrapalhar um diálogo aberto
window.addEventListener('studyflow:sync', () => {
  if (!dlg.open) render();
});

// Mantém "há X minutos" em dia
const tick = () => current === 'notes' && !document.hidden && views.notes.tick();
setInterval(tick, 30000);
document.addEventListener('visibilitychange', tick);

/* ===== Inicialização ===== */
initTheme();
initPrefs();
onPrefs(() => {
  renderUser();
  render();
});
initPwa();
onInstallChange(refreshSettings);
setLang(getPref());
hydrate();
applyStatic();
init().then(() => {
  renderUser();
  render();
  enter();
});
