import { ic } from '../icons.js';
import { state, save, newId } from '../store.js';
import { t } from '../i18n.js';
import { $, app, esc, safeColor, options, byId, ago, fullStamp } from '../util.js';
import { toast, del } from '../ui.js';
import { subjOpts } from '../editors.js';

const PAGE = 30; // posts desenhados por vez: o feed cresce conforme a rolagem

let tab = 'all';
let editingId = null;
let draft = { text: '', subjectId: '' };
let list = [];
let shown = PAGE;
let subjects = new Map();
let io = null;

const when = n => n.created || n.updated || 0;
const avatar = `<div class="avatar">${ic('book')}</div>`;
const act = (name, icon, label, extra = '') => `<button type="button" data-act="${name}" aria-label="${label}" title="${label}"${extra}>${ic(icon)}</button>`;
const tagged = n => esc(n.body).replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, '$1<span class="tag">$2</span>');
const grow = el => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

function postHtml(n) {
  if (n.id === editingId) {
    return `<article class="post editing" data-id="${esc(n.id)}">${avatar}<div class="pbody">
      ${n.title ? `<input id="eTitle" value="${esc(n.title)}" placeholder="${t('notes.titlePh')}" aria-label="${t('notes.titlePh')}">` : ''}
      <textarea id="eText" rows="3" aria-label="${t('notes.body')}">${esc(n.body)}</textarea>
      <div class="cbar"><select id="eSubj" aria-label="${t('subject.label')}">${options(subjOpts(), n.subjectId)}</select>
        <div class="row"><button type="button" id="eCancel">${t('form.cancel')}</button><button type="button" class="primary" id="eSave">${t('form.save')}</button></div></div></div></article>`;
  }
  const s = subjects.get(n.subjectId);
  const ts = when(n);
  return `<article class="post" data-id="${esc(n.id)}">${avatar}<div class="pbody">
    <div class="phead"><b>${t('notes.me')}</b><span class="muted">· <time data-ts="${ts}" title="${esc(fullStamp(ts))}">${ago(ts)}</time></span>${n.pinned ? `<span class="pinned">${ic('pin')} ${t('notes.pinned')}</span>` : ''}</div>
    ${n.title ? `<div class="ptitle">${esc(n.title)}</div>` : ''}
    ${n.body ? `<p class="ptext">${tagged(n)}</p>` : ''}
    ${s ? `<span class="subj" style="--dot:${safeColor(s.color)}">${esc(s.name)}</span>` : ''}
    <div class="pacts">${act('edit', 'edit', t('notes.edit'))}${act('pin', 'pin', n.pinned ? t('notes.unpin') : t('notes.pin'), ` aria-pressed="${!!n.pinned}"`)}${act('del', 'trash', t('form.delete'))}</div></div></article>`;
}

// Mostra mais posts quando o fim do feed se aproxima da tela
function watchEnd() {
  io?.disconnect();
  const more = $('#feedMore');
  if (!more) return;
  io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    const from = shown;
    shown += PAGE;
    more.insertAdjacentHTML('beforebegin', list.slice(from, shown).map(postHtml).join(''));
    if (shown >= list.length) {
      more.remove();
      io.disconnect();
    }
  }, { rootMargin: '600px' });
  io.observe(more);
}

const publish = async () => {
  const text = $('#cText');
  const body = text.value.trim();
  if (!body) return;
  const now = Date.now();
  await save('notes', { id: newId(), title: '', body, subjectId: $('#cSubj').value, created: now, updated: now, pinned: false });
  draft.text = '';
  app.render();
  toast(t('form.saved'));
};

const finishEdit = () => {
  editingId = null;
  app.render();
};

const saveEdit = async () => {
  const editing = state.notes.find(n => n.id === editingId);
  if (!editing) return;
  const title = $('#eTitle')?.value ?? editing.title;
  const body = $('#eText').value.trim();
  if (!body && !title.trim()) return;
  await save('notes', { ...editing, title, body, subjectId: $('#eSubj').value, updated: Date.now() });
  finishEdit();
};

export default {
  draw(view) {
    subjects = byId(state.subjects);
    list = state.notes
      .filter(n => (n.title || '').trim() || (n.body || '').trim())
      .filter(n => tab === 'all' || n.pinned)
      .sort((a, b) => (tab === 'all' ? Number(!!b.pinned) - Number(!!a.pinned) : 0) || when(b) - when(a));

    // Garante que a nota em edição esteja entre as desenhadas
    const at = list.findIndex(n => n.id === editingId);
    if (at >= shown) shown = at + 1;

    const tabs = [['all', 'notes.tabAll'], ['pinned', 'notes.tabPinned']]
      .map(([k, key]) => `<button type="button" role="tab" aria-selected="${tab === k}" data-ntab="${k}" class="${tab === k ? 'on' : ''}">${t(key)}</button>`).join('');

    view.innerHTML = `<div class="timeline">
      <div class="ntabs" role="tablist">${tabs}</div>
      <div class="composer">${avatar}<div class="cbody">
        <textarea id="cText" rows="2" placeholder="${t('notes.compose')}" aria-label="${t('notes.compose')}">${esc(draft.text)}</textarea>
        <div class="cbar"><select id="cSubj" aria-label="${t('subject.label')}">${options(subjOpts(), draft.subjectId)}</select>
          <button type="button" class="primary" id="cPost" disabled>${t('notes.post')}</button></div></div></div>
      <div class="feed">${list.slice(0, shown).map(postHtml).join('') || `<p class="muted empty-feed">${t(tab === 'all' ? 'notes.emptyAll' : 'notes.emptyPinned')}</p>`}${shown < list.length ? '<div id="feedMore" aria-hidden="true"></div>' : ''}</div></div>`;

    this.sync();
    if (editingId && $('#eText')) grow($('#eText'));
    watchEnd();
  },

  // Rascunho fica guardado (sobrevive a trocar de idioma ou de aba)
  sync() {
    const text = $('#cText');
    draft.text = text.value;
    $('#cPost').disabled = !text.value.trim();
    grow(text);
  },

  click(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ntab) {
      tab = b.dataset.ntab;
      shown = PAGE;
      app.render();
    } else if (b.id === 'cPost') publish();
    else if (b.id === 'eCancel') finishEdit();
    else if (b.id === 'eSave') saveEdit();
    else if (b.dataset.act && !b.closest('.editing')) {
      const n = state.notes.find(x => x.id === b.closest('.post').dataset.id);
      if (!n) return;
      if (b.dataset.act === 'edit') {
        editingId = n.id;
        app.render();
        $('#eText')?.focus();
      } else if (b.dataset.act === 'pin') {
        save('notes', { ...n, pinned: !n.pinned }).then(app.render);
      } else del('notes', n);
    }
  },

  input(e) {
    if (e.target.id === 'cText') this.sync();
    else if (e.target.id === 'eText') grow(e.target);
  },

  change(e) {
    if (e.target.id === 'cSubj') draft.subjectId = e.target.value;
  },

  keydown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (e.target.id === 'cText' && mod && e.key === 'Enter') {
      e.preventDefault();
      publish();
    } else if (e.target.id === 'eText') {
      if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      }
    }
  },

  // Atualiza só os textos de "há X minutos", sem redesenhar o feed
  tick() {
    document.querySelectorAll('time[data-ts]').forEach(el => {
      const text = ago(+el.dataset.ts);
      if (el.textContent !== text) el.textContent = text;
    });
  },

  // Ao sair da aba, volta ao estado inicial do feed
  reset() {
    editingId = null;
    shown = PAGE;
    io?.disconnect();
  }
};
