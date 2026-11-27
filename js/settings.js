import { ic } from './icons.js';
import { exportData, importData, MAX_BACKUP_BYTES } from './store.js';
import { t, setLang, getPref, LANGS } from './i18n.js';
import { $, app, esc, todayISO, dayName, VIEWS } from './util.js';
import { dlg, dlgForm, shut } from './ui.js';
import { getThemePref, setThemePref } from './theme.js';
import { canInstall, install, isInstalled } from './pwa.js';
import { ACCENTS, OPTIONS, getPrefs, setPrefs, resetLook, exportPrefs, importPrefs, processPhoto, avatarHtml } from './prefs.js';

const DEV = { name: 'Mateus Gonçalves', repo: 'ogoncas/studyflow', pix: '4ace4c2d-1cf9-44dd-a72f-747861e5148f' };
const THEMES = [['light', 'sun', 'theme.light'], ['dark', 'moon', 'theme.dark'], ['auto', 'monitor', 'theme.system']];
const TABS = ['profile', 'appearance', 'layout', 'general', 'about'];

let tab = 'profile';
let saveTimer = null;
let pending = {};

/* ===== Backup ===== */
function exportBackup() {
  const data = { ...JSON.parse(exportData()), prefs: exportPrefs() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `studyflow-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Retorna 'done', 'invalid' ou null (cancelado)
async function importBackup(file) {
  if (!file) return null;
  if (file.size > MAX_BACKUP_BYTES) return 'invalid';
  if (!confirm(t('backup.confirm'))) return null;
  try {
    const data = importData(await file.text());
    importPrefs(data.prefs);
    app.reset();
    return 'done';
  } catch {
    return 'invalid';
  }
}

async function copyPix() {
  try {
    await navigator.clipboard.writeText(DEV.pix);
    $('#pixMsg').textContent = t('donate.copied');
  } catch {
    getSelection().selectAllChildren($('#pixKey'));
  }
}

/* ===== Peças de interface ===== */
const section = (title, body, cls = '') => `<section${cls ? ` class="${cls}"` : ''}><h4>${title}</h4>${body}</section>`;

// Grupo de botões de rádio ligado a uma preferência
const seg = (key, items) => {
  const cur = String(getPrefs()[key]);
  return `<div class="seg" style="--n:${items.length}" role="radiogroup">${items.map(([v, label]) =>
    `<button type="button" role="radio" aria-checked="${String(v) === cur}" data-pref="${key}" data-val="${esc(v)}">${label}</button>`).join('')}</div>`;
};
const choice = (key, prefix, labels) => seg(key, OPTIONS[key].map(v => [v, t(prefix + (labels ? labels[v] : v))]));

/* ===== Abas ===== */
const panels = {
  profile() {
    const p = getPrefs();
    return `<div class="photo-row">${avatarHtml()}<div class="row start">
        <button type="button" id="phChoose">${ic('upload')} ${t('profile.choose')}</button>
        ${p.photo ? `<button type="button" id="phRemove">${ic('trash')} ${t('profile.remove')}</button>` : ''}</div></div>
      <input type="file" id="phFile" accept="image/jpeg,image/png,image/webp" hidden>
      <p class="muted">${t('profile.hint')}</p><p class="msg bad" id="phMsg" role="alert"></p>
      <label class="field"><span>${t('profile.name')}</span><input id="pfName" maxlength="40" autocomplete="off" placeholder="${t('profile.namePh')}" value="${esc(p.name)}"></label>
      <label class="field"><span>${t('profile.bio')}</span><input id="pfBio" maxlength="60" autocomplete="off" placeholder="${t('profile.bioPh')}" value="${esc(p.bio)}"></label>`;
  },

  appearance() {
    const p = getPrefs();
    const theme = getThemePref();
    const swatches = ACCENTS.map(c => `<button type="button" role="radio" aria-checked="${c === p.accent}" data-pref="accent" data-val="${c}" style="--sw:${c}" aria-label="${c}"></button>`).join('');
    return section(t('settings.theme'), `<div class="seg" role="radiogroup" aria-label="${t('settings.theme')}">${THEMES.map(([v, icon, key]) => `<button type="button" role="radio" aria-checked="${v === theme}" data-theme-opt="${v}">${ic(icon)} ${t(key)}</button>`).join('')}</div>`) +
      section(t('look.accent'), `<div class="swatches" role="radiogroup" aria-label="${t('look.accent')}">${swatches}<input type="color" id="accCustom" value="${p.accent}" aria-label="${t('look.custom')}" title="${t('look.custom')}"></div>`) +
      section(t('look.font'), choice('font', 'look.font.')) +
      section(t('look.size'), choice('fontSize', 'look.size.')) +
      section(t('look.radius'), choice('radius', 'look.radius.')) +
      section(t('look.motion'), seg('motion', [['on', t('look.on')], ['off', t('look.off')]])) +
      `<div class="row start"><button type="button" id="lookReset">${t('look.reset')}</button></div><p class="msg good" id="lookMsg" role="status"></p>`;
  },

  layout() {
    const p = getPrefs();
    const home = `<select data-pref="home" aria-label="${t('lay.home')}">${VIEWS.map(v => `<option value="${v}"${v === p.home ? ' selected' : ''}>${t('nav.' + (v === 'dashboard' ? 'home' : v))}</option>`).join('')}</select>`;
    return section(t('lay.home'), home) +
      section(t('lay.nav'), choice('nav', 'lay.nav.')) +
      section(t('lay.side'), seg('side', [['left', t('lay.left')], ['right', t('lay.right')]]), 'desk-only') +
      section(t('lay.width'), choice('width', 'lay.width.')) +
      section(t('lay.density'), choice('density', 'lay.density.')) +
      section(t('lay.week'), seg('weekStart', [[0, dayName(0)], [1, dayName(1)]]));
  },

  general() {
    const installText = t(isInstalled() ? 'install.done' : canInstall() ? 'install.text' : 'install.unavailable');
    const installBtn = isInstalled() ? '' : `<div class="row start"><button type="button" id="setInstall"${canInstall() ? '' : ' disabled'}>${ic('download')} ${t('install')}</button></div>`;
    return section(t('language'), `<select id="langSel" aria-label="${t('language')}"><option value="auto">${t('langAuto')}</option>${Object.entries(LANGS).map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select>`) +
      section(t('backup.title'), `<p class="muted">${t('backup.hint')}</p>
        <div class="row start"><button type="button" id="bkExport">${ic('download')} ${t('backup.export')}</button><button type="button" id="bkImport">${ic('upload')} ${t('backup.import')}</button></div>
        <input type="file" id="bkFile" accept="application/json,.json" hidden><p class="msg" id="setMsg" role="status"></p>`) +
      section(t('install.title'), `<p class="muted">${installText}</p>${installBtn}`);
  },

  about() {
    return section(t('donate.title'), `<p class="muted">${t('donate.text')}</p><code class="pix" id="pixKey">${DEV.pix}</code>
        <div class="row start"><button type="button" class="primary" id="pixCopy">${ic('heart')} ${t('donate.btn')}</button></div><p class="msg good" id="pixMsg" role="status"></p>`) +
      section(t('about.title'), `<dl class="about">
        <div><dt>${t('about.developer')}</dt><dd>${DEV.name}</dd></div>
        <div><dt>GitHub</dt><dd><a href="https://github.com/${DEV.repo}" target="_blank" rel="noopener noreferrer">${DEV.repo}</a></dd></div>
        <div><dt>${t('about.license')}</dt><dd>${t('about.openSource')}</dd></div></dl>`);
  }
};

function renderSettings() {
  flush(); // o que foi digitado e ainda não gravado aparece de novo ao redesenhar
  dlg.setAttribute('aria-label', t('settings'));
  dlgForm.className = 'settings';
  dlgForm.onsubmit = e => e.preventDefault();
  dlgForm.innerHTML = `<h3>${t('settings')}</h3>
    <div class="stabs" role="tablist">${TABS.map(k => `<button type="button" role="tab" aria-selected="${k === tab}" data-stab="${k}">${t('set.' + k)}</button>`).join('')}</div>
    <div role="tabpanel">${panels[tab]()}</div>
    <div class="row"><button type="button" class="primary" id="setClose">${t('form.close')}</button></div>`;
  if (tab === 'general') $('#langSel').value = getPref();
}

// Salva nome e objetivo pouco depois de parar de digitar
function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (Object.keys(pending).length) setPrefs(pending);
  pending = {};
}
const queueSave = patch => {
  Object.assign(pending, patch);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 300);
};

const setChoice = (btn, key, raw) => {
  const val = OPTIONS[key]?.find(o => String(o) === raw);
  if (val === undefined) return;
  setPrefs({ [key]: val });
  btn.closest('[role=radiogroup]').querySelectorAll('[role=radio]').forEach(b => b.setAttribute('aria-checked', b === btn));
};

dlgForm.addEventListener('click', async e => {
  if (!dlgForm.classList.contains('settings')) return;
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.stab) {
    tab = b.dataset.stab;
    renderSettings();
    dlgForm.querySelector(`[data-stab=${tab}]`).focus();
  } else if (b.dataset.themeOpt) {
    setThemePref(b.dataset.themeOpt);
    b.closest('[role=radiogroup]').querySelectorAll('[role=radio]').forEach(x => x.setAttribute('aria-checked', x === b));
  } else if (b.dataset.pref === 'accent') {
    setPrefs({ accent: b.dataset.val });
    dlgForm.querySelectorAll('[data-pref=accent]').forEach(x => x.setAttribute('aria-checked', x === b));
    $('#accCustom').value = b.dataset.val;
  } else if (b.dataset.pref) setChoice(b, b.dataset.pref, b.dataset.val);
  else if (b.id === 'phChoose') $('#phFile').click();
  else if (b.id === 'phRemove') {
    setPrefs({ photo: '' });
    renderSettings();
  } else if (b.id === 'lookReset') {
    resetLook();
    renderSettings();
    $('#lookMsg').textContent = t('look.resetDone');
  } else if (b.id === 'bkExport') exportBackup();
  else if (b.id === 'bkImport') $('#bkFile').click();
  else if (b.id === 'pixCopy') copyPix();
  else if (b.id === 'setInstall') install().then(ok => ok && shut());
  else if (b.id === 'setClose') shut();
});

dlgForm.addEventListener('input', e => {
  if (!dlgForm.classList.contains('settings')) return;
  if (e.target.id === 'pfName') queueSave({ name: e.target.value });
  else if (e.target.id === 'pfBio') queueSave({ bio: e.target.value });
  else if (e.target.id === 'accCustom') {
    setPrefs({ accent: e.target.value });
    dlgForm.querySelectorAll('[data-pref=accent]').forEach(x => x.setAttribute('aria-checked', x.dataset.val === e.target.value.toLowerCase()));
  }
});

dlgForm.addEventListener('change', async e => {
  if (!dlgForm.classList.contains('settings')) return;
  const el = e.target;
  if (el.dataset.pref === 'home') setPrefs({ home: el.value });
  else if (el.id === 'langSel') {
    setLang(el.value);
    app.refreshLang();
    $('#langSel')?.focus();
  } else if (el.id === 'phFile') {
    const file = el.files[0];
    el.value = '';
    if (!file) return;
    try {
      setPrefs({ photo: await processPhoto(file) });
      renderSettings();
    } catch {
      $('#phMsg').textContent = t('profile.errPhoto');
    }
  } else if (el.id === 'bkFile') {
    const res = await importBackup(el.files[0]);
    el.value = '';
    if (!res) return;
    renderSettings();
    const msg = $('#setMsg');
    msg.className = 'msg ' + (res === 'done' ? 'good' : 'bad');
    msg.textContent = t(res === 'done' ? 'backup.done' : 'backup.invalid');
  }
});

// Ao fechar, grava o que ainda estava aguardando
dlg.addEventListener('close', flush);

export function openSettings(startTab) {
  if (TABS.includes(startTab)) tab = startTab;
  renderSettings();
  if (!dlg.open) dlg.showModal();
}

// Redesenha as configurações abertas (ex.: depois de trocar o idioma)
export const refreshSettings = () => {
  if (dlg.open && dlgForm.classList.contains('settings')) renderSettings();
};
