import { t } from './i18n.js';
import { $ } from './util.js';
import { dlg, dlgForm, shut, toast } from './ui.js';

const SEEN_KEY = 'studyflow-install-seen';
const mobile = matchMedia('(max-width: 800px)');
const listeners = [];
let ev = null;

export const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const canInstall = () => !!ev && !isInstalled();
export const onInstallChange = fn => listeners.push(fn);
const changed = () => {
  $('#installBtn').hidden = !canInstall();
  listeners.forEach(fn => fn());
};

export async function install() {
  if (!ev) return false;
  ev.prompt();
  const { outcome } = await ev.userChoice;
  ev = null;
  changed();
  return outcome === 'accepted';
}

const seen = () => {
  try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; }
};
const markSeen = () => {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
};

// Primeira execução no celular: oferece instalar e avisa que dá para fazer depois nas configurações
function offerInstall() {
  if (dlg.open) return;
  dlg.setAttribute('aria-label', t('install.title'));
  dlgForm.className = '';
  dlgForm.onchange = null;
  dlgForm.onsubmit = e => e.preventDefault();
  dlgForm.innerHTML = `<h3>${t('install.title')}</h3><p>${t('install.text')}</p><p class="muted">${t('install.hint')}</p>
    <div class="row"><button type="button" data-do="later">${t('install.later')}</button><button type="button" class="primary" data-do="go">${t('install.title')}</button></div>`;
  dlgForm.onclick = async e => {
    const act = e.target.closest('[data-do]')?.dataset.do;
    if (!act) return;
    shut();
    if (act === 'go') await install();
  };
  dlg.showModal();
  markSeen();
}

export function initPwa() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    ev = e;
    changed();
    if (mobile.matches && !seen() && canInstall()) setTimeout(() => canInstall() && offerInstall(), 1500);
  });
  $('#installBtn').onclick = install;
  window.addEventListener('appinstalled', () => {
    ev = null;
    changed();
    toast(t('installed'));
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
