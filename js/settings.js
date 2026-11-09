import { ic } from './icons.js';
import { exportData, importData } from './store.js';
import { t, setLang, getPref, LANGS } from './i18n.js';
import { $, app, todayISO } from './util.js';
import { dlg, dlgForm, shut } from './ui.js';
import { getThemePref, setThemePref } from './theme.js';
import { canInstall, install, isInstalled } from './pwa.js';

const DEV = { name: 'Mateus Gonçalves', repo: 'ogoncas/studyflow' };
const THEMES = [['light', 'sun', 'theme.light'], ['dark', 'moon', 'theme.dark'], ['auto', 'monitor', 'theme.system']];

function exportBackup() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
  a.download = `studyflow-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Retorna 'done', 'invalid' ou null (cancelado)
async function importBackup(file) {
  if (!file || !confirm(t('backup.confirm'))) return null;
  try {
    importData(await file.text());
    app.reset();
    return 'done';
  } catch {
    return 'invalid';
  }
}

function renderSettings() {
  const themePref = getThemePref();
  dlg.setAttribute('aria-label', t('settings'));
  dlgForm.className = 'settings';
  dlgForm.onsubmit = e => e.preventDefault();
  dlgForm.innerHTML = `<h3>${t('settings')}</h3>
    <section><h4>${t('settings.theme')}</h4><div class="seg" role="radiogroup" aria-label="${t('settings.theme')}">${THEMES.map(([v, icon, key]) => `<button type="button" role="radio" aria-checked="${v === themePref}" data-theme-opt="${v}">${ic(icon)} ${t(key)}</button>`).join('')}</div></section>
    <section><h4>${t('language')}</h4><select id="langSel" aria-label="${t('language')}"><option value="auto">${t('langAuto')}</option>${Object.entries(LANGS).map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select></section>
    <section><h4>${t('backup.title')}</h4><p class="muted">${t('backup.hint')}</p>
      <div class="row start"><button type="button" id="bkExport">${ic('download')} ${t('backup.export')}</button><button type="button" id="bkImport">${ic('upload')} ${t('backup.import')}</button></div>
      <input type="file" id="bkFile" accept="application/json,.json" hidden><p class="msg" id="setMsg" role="status"></p></section>
    <section><h4>${t('install.title')}</h4><p class="muted">${t(isInstalled() ? 'install.done' : canInstall() ? 'install.text' : 'install.unavailable')}</p>
      ${isInstalled() ? '' : `<div class="row start"><button type="button" id="setInstall"${canInstall() ? '' : ' disabled'}>${ic('download')} ${t('install')}</button></div>`}</section>
    <section><h4>${t('about.title')}</h4><dl class="about">
      <div><dt>${t('about.developer')}</dt><dd>${DEV.name}</dd></div>
      <div><dt>GitHub</dt><dd><a href="https://github.com/${DEV.repo}" target="_blank" rel="noopener noreferrer">${DEV.repo}</a></dd></div>
      <div><dt>${t('about.license')}</dt><dd>${t('about.openSource')}</dd></div></dl></section>
    <div class="row"><button type="button" class="primary" id="setClose">${t('form.close')}</button></div>`;

  $('#langSel').value = getPref();

  dlgForm.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.themeOpt) {
      setThemePref(b.dataset.themeOpt);
      dlgForm.querySelectorAll('[data-theme-opt]').forEach(x => x.setAttribute('aria-checked', x === b));
    } else if (b.id === 'bkExport') exportBackup();
    else if (b.id === 'bkImport') $('#bkFile').click();
    else if (b.id === 'setInstall') install().then(ok => ok && shut());
    else if (b.id === 'setClose') shut();
  };

  dlgForm.onchange = async e => {
    if (e.target.id === 'langSel') {
      setLang(e.target.value);
      app.refreshLang();
      $('#langSel').focus();
    } else if (e.target.id === 'bkFile') {
      const res = await importBackup(e.target.files[0]);
      e.target.value = '';
      if (!res) return;
      const msg = $('#setMsg');
      msg.className = 'msg ' + (res === 'done' ? 'good' : 'bad');
      msg.textContent = t(res === 'done' ? 'backup.done' : 'backup.invalid');
    }
  };
}

export function openSettings() {
  renderSettings();
  if (!dlg.open) dlg.showModal();
}

// Redesenha as configurações abertas (ex.: depois de trocar o idioma)
export const refreshSettings = () => {
  if (dlg.open && dlgForm.classList.contains('settings')) renderSettings();
};
