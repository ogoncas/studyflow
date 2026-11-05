import { ic, hydrate } from './icons.js';
import { state, init, save, remove, newId, exportData, importData } from './store.js';
import { t, setLang, getPref, locale, applyStatic, LANGS } from './i18n.js';

/* ===== Constantes e utilitários ===== */
const $ = s => document.querySelector(s);
const view = $('#view');
const dlg = $('#dlg');
const dlgForm = $('#dlgForm');

const VIEWS = ['dashboard', 'schedule', 'calendar', 'notes', 'subjects'];
// Os tipos são guardados em português nos dados; só o rótulo é traduzido
const TYPES = ['Prova', 'Trabalho', 'Evento'];
const TYPE_COLORS = { Prova: '#e5484d', Trabalho: '#f59e0b', Evento: '#10b981' };

// Tudo que vem do armazenamento (ou de um backup) passa por esc/safeColor/typeOf antes de ir ao HTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#888';
const typeOf = x => TYPES.includes(x) ? x : 'Evento';
const typeLabel = x => t('type.' + typeOf(x));
const options = (list, sel) => list.map(o => `<option value="${esc(o[0])}"${o[0] === sel ? ' selected' : ''}>${esc(o[1])}</option>`).join('');

const cap = s => s[0].toUpperCase() + s.slice(1);
const dayName = i => cap(new Date(2023, 0, 1 + i).toLocaleDateString(locale(), { weekday: 'long' }));
const dayShort = i => dayName(i).slice(0, 3);

const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
const todayISO = () => new Date().toLocaleDateString('sv');
const fmtDate = iso => new Date(iso + 'T00:00').toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
const daysUntil = iso => Math.round((new Date(iso + 'T00:00') - new Date(todayISO() + 'T00:00')) / 864e5);
const inDays = n => n === 0 ? t('when.today') : n === 1 ? t('when.tomorrow') : t('when.days', { n });
const greet = () => {
  const h = new Date().getHours();
  return t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening');
};

// Tempo relativo no idioma atual; passada uma semana, mostra a data
const ago = ts => {
  const diff = (ts - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto', style: 'short' });
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
  const sameYear = new Date(ts).getFullYear() === new Date().getFullYear();
  return new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
};

const byStart = (a, b) => a.start.localeCompare(b.start);
const subj = id => state.subjects.find(s => s.id === id);
const subjOpts = () => [['', t('form.none')], ...state.subjects.map(s => [s.id, s.name])];
const avg = s => {
  const n = (s || '').split(/[;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => !isNaN(x));
  return n.length ? (n.reduce((a, b) => a + b) / n.length).toFixed(1) : '—';
};

const initialView = new URLSearchParams(location.search).get('view');
let current = VIEWS.includes(initialView) ? initialView : 'dashboard';
let cursor = new Date();
let notesTab = 'all';
let editingId = null;
let draft = { text: '', subjectId: '' };
let schedDay = null;

/* ===== Interface compartilhada ===== */
const shut = () => {
  dlg.classList.add('out');
  setTimeout(() => {
    dlg.close();
    dlg.classList.remove('out');
  }, 180);
};

// Desliza o elemento para o lado do clique (dir = 1 ou -1)
const anim = (sel, dir) => {
  const e = $(sel);
  e.style.setProperty('--dir', dir);
  e.classList.add('slide');
};

// Aviso temporário; opts.action = { label, run } adiciona um botão (ex.: Desfazer)
const toast = (msg, opts = {}) => {
  $('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${ic(opts.icon || 'check')} ${esc(msg)}`;
  if (opts.action) {
    const b = document.createElement('button');
    b.textContent = opts.action.label;
    b.onclick = () => { opts.action.run(); el.remove(); };
    el.append(b);
  }
  document.body.append(el);
  setTimeout(() => {
    el.classList.add('bye');
    setTimeout(() => el.remove(), 200);
  }, opts.action ? 5000 : 1800);
};

// Remove e oferece desfazer
async function del(col, item) {
  await remove(col, item.id);
  render();
  toast(t('form.removed'), { action: { label: t('form.undo'), run: async () => { await save(col, item); render(); } } });
}

function renderUser() {
  $('#userBox').innerHTML = `<p class="muted">${ic('drive')} ${t('offlineNote')}</p>`;
}

function form(title, fields, item, onOk, onDel) {
  dlg.setAttribute('aria-label', title);
  dlgForm.className = '';
  dlgForm.innerHTML = `<h3>${title}</h3>` + fields.map(f => `<label>${f.l}` +
    (f.t === 'select'
      ? `<select name="${f.n}">${options(f.o)}</select>`
      : `<input name="${f.n}" type="${f.t || 'text'}" autocomplete="off"${f.p ? ` placeholder="${f.p}"` : ''}${f.r ? ' required' : ''}>`) +
    `</label>`).join('') +
    `<p class="err" role="alert"></p><div class="row">` +
    (onDel ? `<button type="button" class="danger" id="dlgD">${t('form.delete')}</button>` : '') +
    `<button type="button" id="dlgX">${t('form.cancel')}</button><button class="primary">${t('form.save')}</button></div>`;

  fields.forEach(f => dlgForm.elements[f.n].value = item?.[f.n] ?? f.d ?? '');

  $('#dlgX').onclick = () => shut();
  if (onDel) {
    $('#dlgD').onclick = async () => {
      await onDel();
      shut();
    };
  }
  dlgForm.onsubmit = async e => {
    e.preventDefault();
    const btn = dlgForm.querySelector('.primary');
    btn.disabled = true;
    try {
      const msg = await onOk(Object.fromEntries(new FormData(dlgForm)));
      shut();
      render();
      toast(msg || t('form.saved'));
    } catch (x) {
      dlgForm.querySelector('.err').textContent = x.message;
      btn.disabled = false;
    }
  };
  if (!dlg.open) dlg.showModal();
}

/* ===== Formulários de cada item ===== */
const editClass = item => form(item.id ? t('class.edit') : t('class.new'), [
  { n: 'subjectId', l: t('subject.label'), t: 'select', o: subjOpts() },
  { n: 'start', l: t('class.start'), t: 'time', d: '08:00', r: 1 },
  { n: 'end', l: t('class.end'), t: 'time', d: '09:00', r: 1 }
], item,
  d => {
    if (d.end <= d.start) throw new Error(t('class.errEnd'));
    return save('schedule', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('schedule', item)));

const editEvent = item => form(item.id ? t('event.edit') : t('event.new'), [
  { n: 'title', l: t('event.title'), r: 1 },
  { n: 'date', l: t('event.date'), t: 'date', r: 1 },
  { n: 'type', l: t('event.type'), t: 'select', o: TYPES.map(x => [x, typeLabel(x)]) }
], item,
  d => {
    if (!d.title.trim()) throw new Error(t('event.errTitle'));
    return save('events', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('events', item)));

const editSubject = item => form(item.id ? t('subject.edit') : t('subject.new'), [
  { n: 'name', l: t('subject.name'), r: 1 },
  { n: 'teacher', l: t('subject.teacher') },
  { n: 'room', l: t('subject.room') },
  { n: 'color', l: t('subject.color'), t: 'color', d: '#4f6df5' },
  { n: 'grades', l: t('subject.grades'), p: '8,5 7 9' }
], item,
  d => {
    if (!d.name.trim()) throw new Error(t('subject.errName'));
    return save('subjects', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('subjects', item)));

/* ===== Backup ===== */
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
    editingId = null;
    render();
    return 'done';
  } catch {
    return 'invalid';
  }
}

/* ===== Telas ===== */
const views = {
  dashboard() {
    const day = new Date().getDay();
    const hm = new Date().toTimeString().slice(0, 5);
    const classes = state.schedule.filter(c => c.day == day).sort(byStart);
    const upcoming = state.events.filter(e => isDate(e.date) && e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
    const week = upcoming.filter(e => daysUntil(e.date) <= 7).length;

    const classHtml = classes.map(c => {
      const s = subj(c.subjectId);
      const now = c.start <= hm && hm < c.end;
      return `<div class="item" role="button" tabindex="0" data-go="schedule" style="border-color:${safeColor(s?.color)}"><b>${esc(c.start)}–${esc(c.end)}</b> ${esc(s?.name || t('sched.defaultName'))}${now ? ` <span class="badge">${t('dash.now')}</span>` : ''}</div>`;
    }).join('');

    const eventHtml = upcoming.slice(0, 5).map(e => {
      const type = typeOf(e.type);
      return `<div class="item" role="button" tabindex="0" data-go="calendar" style="border-color:${TYPE_COLORS[type]}"><b>${fmtDate(e.date)}</b><span>${esc(e.title)}<span class="muted sub">${typeLabel(type)} · ${inDays(daysUntil(e.date))}</span></span></div>`;
    }).join('');

    view.innerHTML = `<div class="hero"><div><h3>${greet()}!</h3><p>${t('quote.' + new Date().getDate() % 5)}</p></div>
      <div class="stats"><div><b>${classes.length}</b><span>${t('dash.classesToday')}</span></div><div><b>${week}</b><span>${t('dash.in7')}</span></div><div><b>${state.subjects.length}</b><span>${t('dash.subjects')}</span></div></div></div>
    <div class="grid">
      <div class="card"><h3>${t('dash.today', { day: dayName(day) })}</h3>${classHtml || `<p class="muted">${t('dash.noClasses')}</p>`}</div>
      <div class="card"><h3>${t('dash.upcoming')}</h3>${eventHtml || `<p class="muted">${t('dash.nothing')}</p>`}</div>
      <div class="card"><h3>${t('dash.shortcuts')}</h3><div class="row start">
        <button data-new="event">${ic('plus')} ${t('new.event')}</button><button data-new="note">${ic('plus')} ${t('new.note')}</button><button data-new="subject">${ic('plus')} ${t('new.subject')}</button></div></div>
    </div>`;

    view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    view.querySelectorAll('[data-new]').forEach(b => b.onclick = async () => {
      const k = b.dataset.new;
      if (k === 'event') editEvent({ date: todayISO(), type: 'Prova' });
      else if (k === 'subject') editSubject({});
      else { go('notes'); $('#cText')?.focus(); }
    });
  },

  schedule() {
    const today = new Date().getDay();
    const days = [1, 2, 3, 4, 5, 6];
    schedDay ??= today >= 1 ? today : 1;

    const list = d => state.schedule.filter(c => c.day == d).sort(byStart);

    // Sugere o horário logo após a última aula do dia
    const next = d => {
      const last = list(d).at(-1);
      if (!last) return {};
      const [h, m] = last.end.split(':');
      return { start: last.end, end: `${String(Math.min(23, +h + 1)).padStart(2, '0')}:${m}` };
    };

    const tabs = days.map(d => `<button data-tab="${d}" class="${d == schedDay ? 'on' : ''}">${dayShort(d)}${list(d).length ? `<em>${list(d).length}</em>` : ''}${d == today ? '<i class="dot"></i>' : ''}</button>`).join('');

    const cols = days.map(d => {
      const items = list(d).map(c => {
        const s = subj(c.subjectId);
        return `<div class="item cls" role="button" tabindex="0" data-id="${esc(c.id)}" style="border-color:${safeColor(s?.color)}"><div><b>${esc(s?.name || t('sched.defaultName'))}</b><span class="muted">${esc(c.start)}–${esc(c.end)}${s?.room ? ' · ' + esc(t('room', { n: s.room })) : ''}</span></div></div>`;
      }).join('');
      return `<div class="card day ${d == today ? 'is-today' : ''} ${d == schedDay ? 'sel' : ''}"><h3>${dayName(d)}</h3>${items || `<p class="muted empty">${t('sched.empty')}</p>`}<button class="add" data-day="${d}">${ic('plus')} ${t('sched.add')}</button></div>`;
    }).join('');

    view.innerHTML = `<div class="tabs">${tabs}</div><div class="week">${cols}</div>
      <button class="fab" aria-label="${t('sched.addAria')}">${ic('plus')}</button>`;

    const pick = d => {
      const dir = d > schedDay ? 1 : -1;
      schedDay = d;
      render();
      anim('.day.sel', dir);
    };

    view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => pick(+b.dataset.tab));
    view.querySelectorAll('[data-day]').forEach(b => b.onclick = () => editClass({ day: +b.dataset.day, ...next(+b.dataset.day) }));
    view.querySelectorAll('.item').forEach(i => i.onclick = () => editClass(state.schedule.find(c => c.id === i.dataset.id)));
    $('.fab').onclick = () => editClass({ day: schedDay, ...next(schedDay) });

    // Deslizar para os lados troca o dia (celular)
    const week$ = $('.week');
    let x0;
    week$.ontouchstart = e => x0 = e.touches[0].clientX;
    week$.ontouchend = e => {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) pick(Math.min(6, Math.max(1, schedDay + (dx < 0 ? 1 : -1))));
    };
  },

  calendar() {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();
    const label = cap(cursor.toLocaleDateString(locale(), { month: 'long', year: 'numeric' }));

    let cells = '<div></div>'.repeat(first);
    for (let d = 1; d <= n; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const aria = new Date(y, m, d).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
      const chips = state.events.filter(e => e.date === iso)
        .map(e => `<span class="chip t-${typeOf(e.type)}" role="button" tabindex="0" data-id="${esc(e.id)}">${esc(e.title)}</span>`).join('');
      cells += `<div class="d${iso === todayISO() ? ' today' : ''}" role="button" tabindex="0" aria-label="${aria}" data-date="${iso}">${d}${chips}</div>`;
    }

    view.innerHTML = `<div class="bar"><button id="calPrev" aria-label="${t('cal.prev')}">${ic('left')}</button><b>${label}</b>
      <div><button id="calToday">${t('cal.today')}</button><button id="calNext" aria-label="${t('cal.next')}">${ic('right')}</button></div></div>
      <div class="cal">${[0, 1, 2, 3, 4, 5, 6].map(d => `<b class="muted">${dayShort(d)}</b>`).join('')}${cells}</div>`;

    $('#calPrev').onclick = () => { cursor = new Date(y, m - 1, 1); render(); anim('.cal', -1); };
    $('#calNext').onclick = () => { cursor = new Date(y, m + 1, 1); render(); anim('.cal', 1); };
    $('#calToday').onclick = () => { cursor = new Date(); render(); };

    view.querySelectorAll('.d').forEach(c => c.onclick = e => {
      const chip = e.target.closest('.chip');
      editEvent(chip ? state.events.find(x => x.id === chip.dataset.id) : { date: c.dataset.date, type: 'Prova' });
    });
  },

  notes() {
    const when = n => n.created || n.updated || 0;
    const tagged = n => esc(n.body).replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, '$1<span class="tag">$2</span>');
    const visible = state.notes.filter(n => (n.title || '').trim() || (n.body || '').trim());
    const list = visible
      .filter(n => notesTab === 'all' || n.pinned)
      .sort((a, b) => (notesTab === 'all' ? Number(!!b.pinned) - Number(!!a.pinned) : 0) || when(b) - when(a));

    const avatar = `<div class="avatar">${ic('book')}</div>`;
    const act = (name, icon, label, extra = '') => `<button type="button" data-act="${name}" aria-label="${label}" title="${label}"${extra}>${ic(icon)}</button>`;

    const postHtml = n => {
      if (n.id === editingId) {
        return `<article class="post editing" data-id="${esc(n.id)}">${avatar}<div class="pbody">
          ${n.title ? `<input id="eTitle" value="${esc(n.title)}" placeholder="${t('notes.titlePh')}" aria-label="${t('notes.titlePh')}">` : ''}
          <textarea id="eText" rows="3" aria-label="${t('notes.body')}">${esc(n.body)}</textarea>
          <div class="cbar"><select id="eSubj" aria-label="${t('subject.label')}">${options(subjOpts(), n.subjectId)}</select>
            <div class="row"><button type="button" id="eCancel">${t('form.cancel')}</button><button type="button" class="primary" id="eSave">${t('form.save')}</button></div></div></div></article>`;
      }
      const s = subj(n.subjectId);
      return `<article class="post" data-id="${esc(n.id)}">${avatar}<div class="pbody">
        <div class="phead"><b>${t('notes.me')}</b><span class="muted">· <time title="${esc(new Date(when(n)).toLocaleString(locale()))}">${ago(when(n))}</time></span>${n.pinned ? `<span class="pinned">${ic('pin')} ${t('notes.pinned')}</span>` : ''}</div>
        ${n.title ? `<div class="ptitle">${esc(n.title)}</div>` : ''}
        ${n.body ? `<p class="ptext">${tagged(n)}</p>` : ''}
        ${s ? `<span class="subj" style="--dot:${safeColor(s.color)}">${esc(s.name)}</span>` : ''}
        <div class="pacts">${act('edit', 'edit', t('notes.edit'))}${act('pin', 'pin', n.pinned ? t('notes.unpin') : t('notes.pin'), ` aria-pressed="${!!n.pinned}"`)}${act('del', 'trash', t('form.delete'))}</div></div></article>`;
    };

    const tabs = [['all', 'notes.tabAll'], ['pinned', 'notes.tabPinned']]
      .map(([k, key]) => `<button type="button" role="tab" aria-selected="${notesTab === k}" data-ntab="${k}" class="${notesTab === k ? 'on' : ''}">${t(key)}</button>`).join('');

    view.innerHTML = `<div class="timeline">
      <div class="ntabs" role="tablist">${tabs}</div>
      <div class="composer">${avatar}<div class="cbody">
        <textarea id="cText" rows="2" placeholder="${t('notes.compose')}" aria-label="${t('notes.compose')}">${esc(draft.text)}</textarea>
        <div class="cbar"><select id="cSubj" aria-label="${t('subject.label')}">${options(subjOpts(), draft.subjectId)}</select>
          <button type="button" class="primary" id="cPost" disabled>${t('notes.post')}</button></div></div></div>
      <div class="feed">${list.map(postHtml).join('') || `<p class="muted empty-feed">${t(notesTab === 'all' ? 'notes.emptyAll' : 'notes.emptyPinned')}</p>`}</div></div>`;

    const grow = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
    const cText = $('#cText');
    const cPost = $('#cPost');

    // Rascunho fica guardado (sobrevive a trocar de idioma ou de aba)
    const sync = () => {
      draft.text = cText.value;
      cPost.disabled = !cText.value.trim();
      grow(cText);
    };
    cText.addEventListener('input', sync);
    sync();
    $('#cSubj').onchange = e => { draft.subjectId = e.target.value; };

    const publish = async () => {
      const body = cText.value.trim();
      if (!body) return;
      const now = Date.now();
      await save('notes', { id: newId(), title: '', body, subjectId: $('#cSubj').value, created: now, updated: now, pinned: false });
      draft.text = '';
      render();
      toast(t('form.saved'));
    };
    cPost.onclick = publish;
    cText.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); publish(); }
    });

    view.querySelectorAll('[data-ntab]').forEach(b => b.onclick = () => { notesTab = b.dataset.ntab; render(); });

    view.querySelectorAll('.post:not(.editing) [data-act]').forEach(b => b.onclick = async () => {
      const n = state.notes.find(x => x.id === b.closest('.post').dataset.id);
      if (!n) return;
      if (b.dataset.act === 'edit') { editingId = n.id; render(); $('#eText')?.focus(); }
      else if (b.dataset.act === 'pin') { await save('notes', { ...n, pinned: !n.pinned }); render(); }
      else del('notes', n);
    });

    const editing = state.notes.find(n => n.id === editingId);
    if (editing && $('#eText')) {
      const eText = $('#eText');
      const finish = () => { editingId = null; render(); };
      const saveEdit = async () => {
        const title = $('#eTitle')?.value ?? editing.title;
        const body = eText.value.trim();
        if (!body && !title.trim()) return;
        await save('notes', { ...editing, title, body, subjectId: $('#eSubj').value, updated: Date.now() });
        finish();
      };
      grow(eText);
      eText.addEventListener('input', () => grow(eText));
      eText.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); finish(); }
        else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveEdit(); }
      });
      $('#eCancel').onclick = finish;
      $('#eSave').onclick = saveEdit;
    }
  },

  subjects() {
    const cards = state.subjects.map(s => {
      const info = [s.teacher, s.room && t('room', { n: s.room })].filter(Boolean).map(esc).join(' · ');
      return `<div class="card" role="button" tabindex="0" data-id="${esc(s.id)}" style="border-top:4px solid ${safeColor(s.color)}">
        <h3>${esc(s.name)}</h3><p class="muted">${info || t('subject.noDetails')}</p><span class="badge">${t('subject.avg', { n: avg(s.grades) })}</span></div>`;
    }).join('');

    view.innerHTML = `<div class="top"><button class="primary" id="sNew">${ic('plus')} ${t('subject.new')}</button></div>
      <div class="grid">${cards || `<p class="muted">${t('subject.empty')}</p>`}</div>`;

    $('#sNew').onclick = () => editSubject({});
    view.querySelectorAll('.card[data-id]').forEach(c => c.onclick = () => editSubject(state.subjects.find(s => s.id === c.dataset.id)));
  }
};

/* ===== Navegação e tema ===== */
function render() {
  $('#title').textContent = t('title.' + current);
  document.querySelectorAll('#nav nav button').forEach(b => {
    const on = b.dataset.view === current;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  views[current]();
}

// Reinicia a animação de entrada (só ao trocar de aba)
const enter = () => {
  view.classList.remove('enter');
  void view.offsetWidth;
  view.classList.add('enter');
};

const go = v => {
  // Já está nesta tela: não redesenha nem repete a animação
  if (v === current) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  editingId = null;
  current = v;
  render();
  enter();
  window.scrollTo(0, 0);
};

const THEME_KEY = 'studyflow-theme';
const getThemePref = () => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
};

// 'auto' segue o tema do sistema
function applyTheme() {
  const pref = getThemePref();
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]').content = dark ? '#0f1117' : '#f5f6fa';
}

function setThemePref(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {}
  applyTheme();
}

document.querySelectorAll('#nav nav button').forEach(b => b.onclick = () => go(b.dataset.view));
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', applyTheme);
applyTheme();

/* ===== Idioma ===== */
// Reaplica o idioma em tudo que já está na tela
function refreshLang() {
  applyStatic();
  renderUser();
  render();
  if (dlg.open && dlgForm.classList.contains('settings')) renderSettings();
}

// No modo automático, acompanha mudanças de idioma do navegador
window.addEventListener('languagechange', () => {
  if (getPref() !== 'auto') return;
  setLang('auto');
  refreshLang();
});

/* ===== Configurações ===== */
const DEV = { name: 'Mateus Gonçalves', repo: 'ogoncas/studyflow' };
const THEMES = [['light', 'sun', 'theme.light'], ['dark', 'moon', 'theme.dark'], ['auto', 'monitor', 'theme.system']];

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
    <section><h4>${t('about.title')}</h4><dl class="about">
      <div><dt>${t('about.developer')}</dt><dd>${DEV.name}</dd></div>
      <div><dt>GitHub</dt><dd><a href="https://github.com/${DEV.repo}" target="_blank" rel="noopener noreferrer">${DEV.repo}</a></dd></div>
      <div><dt>${t('about.license')}</dt><dd>${t('about.openSource')}</dd></div></dl></section>
    <div class="row"><button type="button" class="primary" id="setClose">${t('form.close')}</button></div>`;

  $('#langSel').value = getPref();
  dlgForm.querySelectorAll('[data-theme-opt]').forEach(b => b.onclick = () => {
    setThemePref(b.dataset.themeOpt);
    dlgForm.querySelectorAll('[data-theme-opt]').forEach(x => x.setAttribute('aria-checked', x === b));
  });
  $('#langSel').onchange = e => {
    setLang(e.target.value);
    refreshLang();
    $('#langSel').focus();
  };
  $('#bkExport').onclick = exportBackup;
  $('#bkImport').onclick = () => $('#bkFile').click();
  $('#bkFile').onchange = async e => {
    const res = await importBackup(e.target.files[0]);
    e.target.value = '';
    if (!res) return;
    const msg = $('#setMsg');
    msg.className = 'msg ' + (res === 'done' ? 'good' : 'bad');
    msg.textContent = t(res === 'done' ? 'backup.done' : 'backup.invalid');
  };
  $('#setClose').onclick = () => shut();
}

function openSettings() {
  renderSettings();
  if (!dlg.open) dlg.showModal();
}
$('#setBtn').onclick = openSettings;

/* ===== Comportamentos globais ===== */
// Itens clicáveis também respondem a Enter e Espaço
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) {
    e.preventDefault();
    e.target.click();
  }
});

// Clicar fora do diálogo fecha, mas só se o clique também começou fora
// (evita fechar ao soltar o mouse depois de selecionar texto)
const outside = e => {
  const r = dlg.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};
let pressedOutside = false;
dlg.addEventListener('pointerdown', e => { pressedOutside = e.target === dlg && outside(e); });
dlg.addEventListener('click', e => {
  if (pressedOutside && outside(e)) shut();
  pressedOutside = false;
});

window.addEventListener('studyflow:error', () => toast(t('err.save'), { icon: 'alert' }));

/* ===== Instalação (PWA) ===== */
const installBtn = $('#installBtn');
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let installEvent = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvent = e;
  installBtn.hidden = isInstalled();
});
installBtn.onclick = async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.hidden = true;
};
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  toast(t('installed'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ===== Inicialização ===== */
setLang(getPref());
hydrate();
applyStatic();
init().then(() => {
  renderUser();
  render();
  enter();
});
