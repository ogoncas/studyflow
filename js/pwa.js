import { t } from './i18n.js';
import { $ } from './util.js';
import { toast } from './ui.js';

export function initPwa() {
  const btn = $('#installBtn');
  const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let ev = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    ev = e;
    btn.hidden = isInstalled();
  });
  btn.onclick = async () => {
    if (!ev) return;
    ev.prompt();
    await ev.userChoice;
    ev = null;
    btn.hidden = true;
  };
  window.addEventListener('appinstalled', () => {
    btn.hidden = true;
    toast(t('installed'));
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
