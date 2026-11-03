import { ic, hydrate } from './icons.js';
import { state, init, save, remove, newId, exportData, importData } from './store.js';

/* ===== Constantes e utilitários ===== */
const $ = s => document.querySelector(s);
const view = $('#view');
const dlg = $('#dlg');
const dlgForm = $('#dlgForm');

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TYPES = ['Prova', 'Trabalho', 'Evento'];
const TYPE_COLORS = { Prova: '#e5484d', Trabalho: '#f59e0b', Evento: '#10b981' };
const TITLES = { dashboard: 'Visão geral', schedule: 'Horário de aulas', calendar: 'Calendário', notes: 'Anotações', subjects: 'Matérias' };
const QUOTES = [
  'Pequenos passos todos os dias levam longe.',
  'Foco no processo, o resultado vem.',
  'Estudar hoje é liberdade amanhã.',
  'Disciplina vence motivação.',
  'Um bloco de cada vez.'
];

// Tudo que vem do armazenamento (ou de um backup) passa por esc/safeColor/typeOf antes de ir ao HTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#888';
const typeOf = t => TYPES.includes(t) ? t : 'Evento';
const options = (list, sel) => list.map(o => `<option value="${esc(o[0])}"${o[0] === sel ? ' selected' : ''}>${esc(o[1])}</option>`).join('');

const todayISO = () => new Date().toLocaleDateString('sv');
const fmtDate = iso => iso.split('-').reverse().slice(0, 2).join('/');
const daysUntil = iso => Math.round((new Date(iso + 'T00:00') - new Date(todayISO() + 'T00:00')) / 864e5);
const inDays = n => n === 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`;
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

const byStart = (a, b) => a.start.localeCompare(b.start);
const subj = id => state.subjects.find(s => s.id === id);
const subjOpts = () => [['', '— Nenhuma —'], ...state.subjects.map(s => [s.id, s.name])];
const avg = s => {
  const n = (s || '').split(/[;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => !isNaN(x));
  return n.length ? (n.reduce((a, b) => a + b) / n.length).toFixed(1) : '—';
};

const initialView = new URLSearchParams(location.search).get('view');
let current = initialView in TITLES ? initialView : 'dashboard';
let cursor = new Date();
let noteId = null;
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
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `${ic(opts.icon || 'check')} ${esc(msg)}`;
  if (opts.action) {
    const b = document.createElement('button');
    b.textContent = opts.action.label;
    b.onclick = () => { opts.action.run(); t.remove(); };
    t.append(b);
  }
  document.body.append(t);
  setTimeout(() => {
    t.classList.add('bye');
    setTimeout(() => t.remove(), 200);
  }, opts.action ? 5000 : 1800);
};

// Remove e oferece desfazer
async function del(col, item) {
  await remove(col, item.id);
  render();
  toast('Removido', { action: { label: 'Desfazer', run: async () => { await save(col, item); render(); } } });
}

function renderUser() {
  $('#userBox').innerHTML = `<p class="muted">${ic('drive')} Funciona offline. Dados salvos neste dispositivo.</p>`;
}

function form(title, fields, item, onOk, onDel) {
  dlg.setAttribute('aria-label', title);
  dlgForm.innerHTML = `<h3>${title}</h3>` + fields.map(f => `<label>${f.l}` +
    (f.t === 'select'
      ? `<select name="${f.n}">${options(f.o)}</select>`
      : `<input name="${f.n}" type="${f.t || 'text'}" autocomplete="off"${f.p ? ` placeholder="${f.p}"` : ''}${f.r ? ' required' : ''}>`) +
    `</label>`).join('') +
    `<p class="err" role="alert"></p><div class="row">` +
    (onDel ? `<button type="button" class="danger" id="dlgD">Excluir</button>` : '') +
    `<button type="button" id="dlgX">Cancelar</button><button class="primary">Salvar</button></div>`;

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
      toast(msg || 'Salvo');
    } catch (x) {
      dlgForm.querySelector('.err').textContent = x.message;
      btn.disabled = false;
    }
  };
  if (!dlg.open) dlg.showModal();
}

/* ===== Formulários de cada item ===== */
const editClass = item => form(item.id ? 'Editar aula' : 'Nova aula', [
  { n: 'subjectId', l: 'Matéria', t: 'select', o: subjOpts() },
  { n: 'start', l: 'Início', t: 'time', d: '08:00', r: 1 },
  { n: 'end', l: 'Fim', t: 'time', d: '09:00', r: 1 }
], item,
  d => {
    if (d.end <= d.start) throw new Error('O fim deve ser depois do início.');
    return save('schedule', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('schedule', item)));

const editEvent = item => form(item.id ? 'Editar evento' : 'Novo evento', [
  { n: 'title', l: 'Título', r: 1 },
  { n: 'date', l: 'Data', t: 'date', r: 1 },
  { n: 'type', l: 'Tipo', t: 'select', o: TYPES.map(t => [t, t]) }
], item,
  d => {
    if (!d.title.trim()) throw new Error('Informe um título.');
    return save('events', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('events', item)));

const editSubject = item => form(item.id ? 'Editar matéria' : 'Nova matéria', [
  { n: 'name', l: 'Nome', r: 1 },
  { n: 'teacher', l: 'Professor' },
  { n: 'room', l: 'Sala' },
  { n: 'color', l: 'Cor', t: 'color', d: '#4f6df5' },
  { n: 'grades', l: 'Notas (separe por espaço)', p: '8,5 7 9' }
], item,
  d => {
    if (!d.name.trim()) throw new Error('Informe o nome.');
    return save('subjects', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('subjects', item)));

async function newNote() {
  prune(null);
  const n = { id: newId(), title: '', body: '', subjectId: '', updated: Date.now() };
  await save('notes', n);
  noteId = n.id;
}

// Descarta notas vazias (criadas e abandonadas)
function prune(keep) {
  state.notes
    .filter(n => n.id !== keep && !n.title.trim() && !n.body.trim())
    .forEach(n => remove('notes', n.id));
}

/* ===== Backup ===== */
function exportBackup() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
  a.download = `studyflow-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importBackup(file) {
  if (!file) return;
  try {
    if (!confirm('Importar substitui todos os dados atuais. Continuar?')) return;
    importData(await file.text());
    noteId = null;
    render();
    toast('Backup importado');
  } catch (x) {
    toast(x.message, { icon: 'alert' });
  }
}

/* ===== Telas ===== */
const views = {
  dashboard() {
    const t = new Date().getDay();
    const hm = new Date().toTimeString().slice(0, 5);
    const classes = state.schedule.filter(c => c.day == t).sort(byStart);
    const upcoming = state.events.filter(e => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
    const week = upcoming.filter(e => daysUntil(e.date) <= 7).length;

    const classHtml = classes.map(c => {
      const s = subj(c.subjectId);
      const now = c.start <= hm && hm < c.end;
      return `<div class="item" role="button" tabindex="0" data-go="schedule" style="border-color:${safeColor(s?.color)}"><b>${esc(c.start)}–${esc(c.end)}</b> ${esc(s?.name || 'Aula')}${now ? ' <span class="badge">Agora</span>' : ''}</div>`;
    }).join('');

    const eventHtml = upcoming.slice(0, 5).map(e => {
      const type = typeOf(e.type);
      return `<div class="item" role="button" tabindex="0" data-go="calendar" style="border-color:${TYPE_COLORS[type]}"><b>${fmtDate(e.date)}</b><span>${esc(e.title)}<span class="muted sub">${type} · ${inDays(daysUntil(e.date))}</span></span></div>`;
    }).join('');

    view.innerHTML = `<div class="hero"><div><h3>${greet()}!</h3><p>${QUOTES[new Date().getDate() % QUOTES.length]}</p></div>
      <div class="stats"><div><b>${classes.length}</b><span>aulas hoje</span></div><div><b>${week}</b><span>em 7 dias</span></div><div><b>${state.subjects.length}</b><span>matérias</span></div></div></div>
    <div class="grid">
      <div class="card"><h3>Hoje (${DAYS[t]})</h3>${classHtml || '<p class="muted">Sem aulas hoje.</p>'}</div>
      <div class="card"><h3>Próximas entregas</h3>${eventHtml || '<p class="muted">Nada agendado.</p>'}</div>
      <div class="card"><h3>Atalhos</h3><div class="row start">
        <button data-new="event">${ic('plus')} Evento</button><button data-new="note">${ic('plus')} Nota</button><button data-new="subject">${ic('plus')} Matéria</button></div></div>
      <div class="card"><h3>Backup</h3><p class="muted">Salve seus dados em um arquivo para guardar ou levar a outro aparelho.</p>
        <div class="row start"><button id="bkExport">${ic('download')} Exportar</button><button id="bkImport">${ic('upload')} Importar</button></div>
        <input type="file" id="bkFile" accept="application/json,.json" hidden></div>
    </div>`;

    view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    view.querySelectorAll('[data-new]').forEach(b => b.onclick = async () => {
      const k = b.dataset.new;
      if (k === 'event') editEvent({ date: todayISO(), type: 'Prova' });
      else if (k === 'subject') editSubject({});
      else { await newNote(); go('notes'); }
    });
    $('#bkExport').onclick = exportBackup;
    $('#bkImport').onclick = () => $('#bkFile').click();
    $('#bkFile').onchange = async e => {
      await importBackup(e.target.files[0]);
      e.target.value = '';
    };
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

    const tabs = days.map(d => `<button data-tab="${d}" class="${d == schedDay ? 'on' : ''}">${DAYS[d].slice(0, 3)}${list(d).length ? `<em>${list(d).length}</em>` : ''}${d == today ? '<i class="dot"></i>' : ''}</button>`).join('');

    const cols = days.map(d => {
      const items = list(d).map(c => {
        const s = subj(c.subjectId);
        return `<div class="item cls" role="button" tabindex="0" data-id="${esc(c.id)}" style="border-color:${safeColor(s?.color)}"><div><b>${esc(s?.name || 'Aula')}</b><span class="muted">${esc(c.start)}–${esc(c.end)}${s?.room ? ' · Sala ' + esc(s.room) : ''}</span></div></div>`;
      }).join('');
      return `<div class="card day ${d == today ? 'is-today' : ''} ${d == schedDay ? 'sel' : ''}"><h3>${DAYS[d]}</h3>${items || '<p class="muted empty">Sem aulas neste dia.</p>'}<button class="add" data-day="${d}">${ic('plus')} Aula</button></div>`;
    }).join('');

    view.innerHTML = `<div class="tabs">${tabs}</div><div class="week">${cols}</div>
      <button class="fab" aria-label="Adicionar aula">${ic('plus')}</button>`;

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
    const month = cursor.toLocaleDateString('pt-BR', { month: 'long' });
    const label = `${month[0].toUpperCase()}${month.slice(1)} de ${y}`;

    let cells = '<div></div>'.repeat(first);
    for (let d = 1; d <= n; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const chips = state.events.filter(e => e.date === iso)
        .map(e => `<span class="chip t-${typeOf(e.type)}" role="button" tabindex="0" data-id="${esc(e.id)}">${esc(e.title)}</span>`).join('');
      cells += `<div class="d${iso === todayISO() ? ' today' : ''}" role="button" tabindex="0" aria-label="${d} de ${month}" data-date="${iso}">${d}${chips}</div>`;
    }

    view.innerHTML = `<div class="bar"><button id="calPrev" aria-label="Mês anterior">${ic('left')}</button><b>${label}</b>
      <div><button id="calToday">Hoje</button><button id="calNext" aria-label="Próximo mês">${ic('right')}</button></div></div>
      <div class="cal">${DAYS.map(d => `<b class="muted">${d.slice(0, 3)}</b>`).join('')}${cells}</div>`;

    $('#calPrev').onclick = () => { cursor = new Date(y, m - 1, 1); render(); anim('.cal', -1); };
    $('#calNext').onclick = () => { cursor = new Date(y, m + 1, 1); render(); anim('.cal', 1); };
    $('#calToday').onclick = () => { cursor = new Date(); render(); };

    view.querySelectorAll('.d').forEach(c => c.onclick = e => {
      const chip = e.target.closest('.chip');
      editEvent(chip ? state.events.find(x => x.id === chip.dataset.id) : { date: c.dataset.date, type: 'Prova' });
    });
  },

  notes() {
    const sel = state.notes.find(n => n.id === noteId);
    const sorted = [...state.notes].sort((a, b) => (b.updated || 0) - (a.updated || 0));

    const listHtml = sorted.map(n => `<div class="item${n.id === noteId ? ' on' : ''}" role="button" tabindex="0" data-id="${esc(n.id)}"><span>${esc(n.title || 'Sem título')}</span></div>`).join('');
    const editor = sel
      ? `<button class="back" id="nBack">${ic('left')} Notas</button>
         <input id="nTitle" value="${esc(sel.title)}" placeholder="Título" aria-label="Título">
         <label>Matéria<select id="nSubj">${options(subjOpts(), sel.subjectId)}</select></label>
         <textarea id="nBody" rows="14" placeholder="Escreva aqui..." aria-label="Anotação">${esc(sel.body)}</textarea>
         <div class="row between"><span class="muted">Salvo automaticamente</span><button class="danger" id="nDel">Excluir</button></div>`
      : '<p class="muted">Selecione ou crie uma nota.</p>';

    view.innerHTML = `<div class="notes${sel ? ' editing' : ''}">
      <div class="card list"><button class="primary" id="nNew">${ic('plus')} Nova nota</button>${listHtml}</div>
      <div class="card editor">${editor}</div></div>`;

    $('#nNew').onclick = async () => { await newNote(); render(); $('#nTitle')?.focus(); };
    view.querySelectorAll('.list .item').forEach(i => i.onclick = () => { prune(i.dataset.id); noteId = i.dataset.id; render(); });

    if (!sel) return;
    $('#nBack').onclick = () => { prune(null); noteId = null; render(); };

    // Salva a cada alteração, sem recriar a tela (mantém o foco)
    const commit = () => {
      Object.assign(sel, { title: $('#nTitle').value, body: $('#nBody').value, subjectId: $('#nSubj').value, updated: Date.now() });
      save('notes', sel);
      const label = view.querySelector(`.list .item[data-id="${sel.id}"] span`);
      if (label) label.textContent = sel.title || 'Sem título';
    };
    ['#nTitle', '#nBody', '#nSubj'].forEach(s => $(s).addEventListener('input', commit));
    $('#nDel').onclick = async () => { noteId = null; await del('notes', sel); };
  },

  subjects() {
    const cards = state.subjects.map(s => {
      const info = [s.teacher, s.room && `Sala ${s.room}`].filter(Boolean).map(esc).join(' · ');
      return `<div class="card" role="button" tabindex="0" data-id="${esc(s.id)}" style="border-top:4px solid ${safeColor(s.color)}">
        <h3>${esc(s.name)}</h3><p class="muted">${info || 'Sem detalhes'}</p><span class="badge">Média ${avg(s.grades)}</span></div>`;
    }).join('');

    view.innerHTML = `<div class="top"><button class="primary" id="sNew">${ic('plus')} Nova matéria</button></div>
      <div class="grid">${cards || '<p class="muted">Nenhuma matéria cadastrada.</p>'}</div>`;

    $('#sNew').onclick = () => editSubject({});
    view.querySelectorAll('.card[data-id]').forEach(c => c.onclick = () => editSubject(state.subjects.find(s => s.id === c.dataset.id)));
  }
};

/* ===== Navegação e tema ===== */
function render() {
  $('#title').textContent = TITLES[current];
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
  if (v !== 'notes') prune(null);
  current = v;
  render();
  enter();
  window.scrollTo(0, 0);
};

const setTheme = t => {
  document.documentElement.dataset.theme = t;
  $('#themeBtn').innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
  $('meta[name=theme-color]').content = t === 'dark' ? '#0f1117' : '#f5f6fa';
  try { localStorage.setItem('studyflow-theme', t); } catch {}
};

document.querySelectorAll('#nav nav button').forEach(b => b.onclick = () => go(b.dataset.view));
$('#themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setTheme(document.documentElement.dataset.theme || 'light');

// Itens clicáveis também respondem a Enter e Espaço
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button]')) {
    e.preventDefault();
    e.target.click();
  }
});

// Clicar fora do diálogo fecha
dlg.addEventListener('click', e => {
  const r = dlg.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) shut();
});

window.addEventListener('studyflow:error', () => toast('Não foi possível salvar os dados.', { icon: 'alert' }));

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
  toast('App instalado');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* ===== Inicialização ===== */
hydrate();
init().then(() => {
  renderUser();
  render();
  enter();
});
