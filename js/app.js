import { ic, hydrate } from './icons.js';
import { state, init, save, remove, newId } from './store.js';

/* ===== Constantes e utilitários ===== */
const $ = s => document.querySelector(s);
const view = $('#view');
const dlg = $('#dlg');
const dlgForm = $('#dlgForm');

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TYPES = ['Prova', 'Trabalho', 'Evento'];
const TITLES = { dashboard: 'Visão geral', schedule: 'Horário de aulas', calendar: 'Calendário', notes: 'Anotações', subjects: 'Matérias' };
const QUOTES = [
  'Pequenos passos todos os dias levam longe.',
  'Foco no processo, o resultado vem.',
  'Estudar hoje é liberdade amanhã.',
  'Disciplina vence motivação.',
  'Um bloco de cada vez.'
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => new Date().toLocaleDateString('sv');
const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

const subj = id => state.subjects.find(s => s.id === id);
const subjOpts = () => [['', '— Nenhuma —'], ...state.subjects.map(s => [s.id, s.name])];
const avg = s => {
  const n = (s || '').split(/[;\s]+/).map(x => parseFloat(x.replace(',', '.'))).filter(x => !isNaN(x));
  return n.length ? (n.reduce((a, b) => a + b) / n.length).toFixed(1) : '—';
};

let current = 'dashboard';
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

const toast = msg => {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${ic('check')} ${msg}`;
  document.body.append(t);
  setTimeout(() => {
    t.classList.add('bye');
    setTimeout(() => t.remove(), 200);
  }, 1800);
};

function renderUser() {
  $('#userBox').innerHTML = `<p class="muted">${ic('drive')} Dados salvos de maneira offline.</p>`;
}

function form(title, fields, item, onOk, onDel, extra = '', ok = 'Salvar') {
  dlgForm.innerHTML = `<h3>${title}</h3>` + fields.map(f => `<label>${f.l}` +
    (f.t === 'select'
      ? `<select name="${f.n}">${f.o.map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`
      : `<input name="${f.n}" type="${f.t || 'text'}" ${f.p ? `placeholder="${f.p}"` : ''}>`) +
    `</label>`).join('') +
    `<p class="err"></p><div class="row"><button type="button" class="ghost" id="dlgX">Cancelar</button>` +
    (onDel ? `<button type="button" class="danger" id="dlgD">Excluir</button>` : '') +
    `<button class="primary">${ok}</button></div>${extra}`;

  fields.forEach(f => dlgForm.elements[f.n].value = item?.[f.n] ?? f.d ?? '');

  $('#dlgX').onclick = () => shut();
  if (onDel) {
    $('#dlgD').onclick = async () => {
      await onDel();
      shut();
      render();
      toast('Removido');
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

/* ===== Telas ===== */
const views = {
  dashboard() {
    const t = new Date().getDay();
    const classes = state.schedule
      .filter(c => c.day == t)
      .sort((a, b) => a.start.localeCompare(b.start));
    const next = state.events
      .filter(e => e.date >= todayISO())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    view.innerHTML = `<div class="hero"><div><h3>${greet()}!</h3><p>${QUOTES[new Date().getDate() % QUOTES.length]}</p></div><div class="stats"><div><b>${classes.length}</b><span>aulas hoje</span></div><div><b>${next.length}</b><span>entregas</span></div><div><b>${state.subjects.length}</b><span>matérias</span></div></div></div>
    <div class="grid">
      <div class="card"><h3>Hoje (${DAYS[t]})</h3>${classes.map(c => `<div class="item" style="border-color:${subj(c.subjectId)?.color || '#888'}">${c.start}–${c.end} ${esc(subj(c.subjectId)?.name || 'Aula')}</div>`).join('') || '<p class="muted">Sem aulas hoje.</p>'}</div>
      <div class="card"><h3>Próximas entregas</h3>${next.map(e => `<div class="item"><b>${e.date.split('-').reverse().slice(0, 2).join('/')}</b> ${esc(e.title)} <span class="muted">${e.type}</span></div>`).join('') || '<p class="muted">Nada agendado.</p>'}</div>
      <div class="card"><h3>Atalhos</h3><div class="row" style="justify-content:flex-start;flex-wrap:wrap">
        <button data-go="calendar">${ic('plus')} Evento</button><button data-go="notes">${ic('plus')} Nota</button><button data-go="subjects">${ic('plus')} Matéria</button></div></div>
    </div>`;

    view.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  },

  schedule() {
    const today = new Date().getDay();
    const days = [1, 2, 3, 4, 5, 6];
    schedDay ??= today >= 1 ? today : 1;

    const list = d => state.schedule
      .filter(c => c.day == d)
      .sort((a, b) => a.start.localeCompare(b.start));

    // Sugere o horário logo após a última aula do dia
    const next = d => {
      const last = list(d).at(-1);
      if (!last) return {};
      const [h, m] = last.end.split(':');
      return { start: last.end, end: `${String(Math.min(23, +h + 1)).padStart(2, '0')}:${m}` };
    };

    view.innerHTML = `<div class="tabs">${days.map(d => `<button data-tab="${d}" class="${d == schedDay ? 'on' : ''}">${DAYS[d].slice(0, 3)}${list(d).length ? `<em>${list(d).length}</em>` : ''}${d == today ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>
    <div class="week">${days.map(d => `<div class="card day ${d == today ? 'is-today' : ''} ${d == schedDay ? 'sel' : ''}"><h3>${DAYS[d]}</h3>
      ${list(d).map(c => { const sb = subj(c.subjectId); return `<div class="item cls" data-id="${c.id}" style="border-color:${sb?.color || '#888'}"><div><b>${esc(sb?.name || 'Aula')}</b><span class="muted">${c.start}–${c.end}${sb?.room ? ' · Sala ' + esc(sb.room) : ''}</span></div></div>`; }).join('') || '<p class="muted empty">Sem aulas neste dia.</p>'}
      <button class="add" data-day="${d}">${ic('plus')} Aula</button></div>`).join('')}</div>
    <button class="fab" aria-label="Adicionar aula">${ic('plus')}</button>`;

    const edit = item => form(item.id ? 'Editar aula' : 'Nova aula', [
      { n: 'subjectId', l: 'Matéria', t: 'select', o: subjOpts() },
      { n: 'start', l: 'Início', t: 'time', d: '08:00' },
      { n: 'end', l: 'Fim', t: 'time', d: '09:00' }
    ], item,
      d => save('schedule', { ...item, ...d, id: item.id || newId() }),
      item.id && (() => remove('schedule', item.id)));

    const pick = d => {
      const dir = d > schedDay ? 1 : -1;
      schedDay = d;
      render();
      anim('.day.sel', dir);
    };

    view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => pick(+b.dataset.tab));
    view.querySelectorAll('[data-day]').forEach(b => b.onclick = () => edit({ day: +b.dataset.day, ...next(+b.dataset.day) }));
    view.querySelectorAll('.item').forEach(i => i.onclick = () => edit(state.schedule.find(c => c.id === i.dataset.id)));
    $('.fab').onclick = () => edit({ day: schedDay, ...next(schedDay) });

    // Deslizar para os lados troca o dia (celular)
    const week = $('.week');
    let x0;
    week.ontouchstart = e => x0 = e.touches[0].clientX;
    week.ontouchend = e => {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) pick(Math.min(6, Math.max(1, schedDay + (dx < 0 ? 1 : -1))));
    };
  },

  calendar() {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();

    let cells = '<div></div>'.repeat(first);
    for (let d = 1; d <= n; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells += `<div class="d ${iso === todayISO() ? 'today' : ''}" data-date="${iso}">${d}${state.events.filter(e => e.date === iso).map(e => `<span class="chip t-${e.type}" data-id="${e.id}">${esc(e.title)}</span>`).join('')}</div>`;
    }

    view.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><button id="pv">◀</button><b>${cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><button id="nx">▶</button></div><br>
      <div class="cal">${DAYS.map(d => `<b class="muted">${d.slice(0, 3)}</b>`).join('')}${cells}</div>`;

    $('#pv').onclick = () => { cursor = new Date(y, m - 1, 1); render(); anim('.cal', -1); };
    $('#nx').onclick = () => { cursor = new Date(y, m + 1, 1); render(); anim('.cal', 1); };

    const edit = item => form(item.id ? 'Editar evento' : 'Novo evento', [
      { n: 'title', l: 'Título' },
      { n: 'date', l: 'Data', t: 'date' },
      { n: 'type', l: 'Tipo', t: 'select', o: TYPES.map(t => [t, t]) }
    ], item,
      d => {
        if (!d.title.trim()) throw new Error('Informe um título.');
        return save('events', { ...item, ...d, id: item.id || newId() });
      },
      item.id && (() => remove('events', item.id)));

    view.querySelectorAll('.d').forEach(c => c.onclick = e => {
      const chip = e.target.closest('.chip');
      edit(chip ? state.events.find(x => x.id === chip.dataset.id) : { date: c.dataset.date, type: 'Prova' });
    });
  },

  notes() {
    const sel = state.notes.find(n => n.id === noteId);

    view.innerHTML = `<div class="notes"><div class="card"><button class="primary" id="nn">${ic('plus')} Nova nota</button>
      ${state.notes.map(n => `<div class="item" data-id="${n.id}">${esc(n.title || 'Sem título')}</div>`).join('')}</div>
      <div class="card">${sel ? `<input id="nt" value="${esc(sel.title)}" placeholder="Título"><label>Matéria<select id="ns">${subjOpts().map(o => `<option value="${o[0]}" ${o[0] === sel.subjectId ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>
      <textarea id="nb" rows="14" placeholder="Escreva aqui...">${esc(sel.body)}</textarea>
      <div class="row"><button class="danger" id="nd">Excluir</button><button class="primary" id="ni">Salvar</button></div>` : '<p class="muted">Selecione ou crie uma nota.</p>'}</div></div>`;

    $('#nn').onclick = async () => {
      const n = { id: newId(), title: '', body: '', subjectId: '' };
      await save('notes', n);
      noteId = n.id;
      render();
    };
    view.querySelectorAll('.item').forEach(i => i.onclick = () => { noteId = i.dataset.id; render(); });

    if (sel) {
      $('#ni').onclick = async () => {
        await save('notes', { ...sel, title: $('#nt').value, body: $('#nb').value, subjectId: $('#ns').value });
        render();
      };
      $('#nd').onclick = async () => {
        await remove('notes', sel.id);
        noteId = null;
        render();
      };
    }
  },

  subjects() {
    view.innerHTML = `<button class="primary" id="ns">${ic('plus')} Nova matéria</button><br><br><div class="grid">${state.subjects.map(s => `<div class="card" data-id="${s.id}" style="border-top:4px solid ${s.color};cursor:pointer">
      <h3>${esc(s.name)}</h3><p class="muted">${esc(s.teacher)} · Sala ${esc(s.room)}</p><span class="badge">Média ${avg(s.grades)}</span></div>`).join('') || '<p class="muted">Nenhuma matéria cadastrada.</p>'}</div>`;

    const edit = item => form(item.id ? 'Editar matéria' : 'Nova matéria', [
      { n: 'name', l: 'Nome' },
      { n: 'teacher', l: 'Professor' },
      { n: 'room', l: 'Sala' },
      { n: 'color', l: 'Cor', t: 'color', d: '#4f6df5' },
      { n: 'grades', l: 'Notas (separe por espaço)', p: '8,5 7 9' }
    ], item,
      d => {
        if (!d.name.trim()) throw new Error('Informe o nome.');
        return save('subjects', { ...item, ...d, id: item.id || newId() });
      },
      item.id && (() => remove('subjects', item.id)));

    $('#ns').onclick = () => edit({});
    view.querySelectorAll('.card[data-id]').forEach(c => c.onclick = () => edit(state.subjects.find(s => s.id === c.dataset.id)));
  }
};

/* ===== Navegação e tema ===== */
function render() {
  $('#title').textContent = TITLES[current];
  document.querySelectorAll('#nav nav button').forEach(b => b.classList.toggle('on', b.dataset.view === current));
  views[current]();
}

// Reinicia a animação de entrada (só ao trocar de aba)
const enter = () => {
  view.classList.remove('enter');
  void view.offsetWidth;
  view.classList.add('enter');
};

const go = v => {
  current = v;
  render();
  enter();
  window.scrollTo(0, 0);
};

const setTheme = t => {
  document.documentElement.dataset.theme = t;
  $('#themeBtn').innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
  localStorage.setItem('studyflow-theme', t);
};

document.querySelectorAll('#nav nav button').forEach(b => b.onclick = () => go(b.dataset.view));
$('#themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
setTheme(localStorage.getItem('studyflow-theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));

/* ===== Inicialização ===== */
hydrate();
init().then(() => {
  renderUser();
  render();
  enter();
});
