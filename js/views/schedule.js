import { ic } from '../icons.js';
import { state } from '../store.js';
import { t } from '../i18n.js';
import { $, app, esc, safeColor, byId, byStart, dayName, dayShort } from '../util.js';
import { anim } from '../ui.js';
import { editClass } from '../editors.js';

let schedDay = null;
let x0 = 0;

const list = d => state.schedule.filter(c => c.day == d).sort(byStart);

// Sugere o horário logo após a última aula do dia
const next = d => {
  const last = list(d).at(-1);
  if (!last) return {};
  const [h, m] = last.end.split(':');
  return { start: last.end, end: `${String(Math.min(23, +h + 1)).padStart(2, '0')}:${m}` };
};

const pick = d => {
  const dir = d > schedDay ? 1 : -1;
  schedDay = d;
  app.render();
  anim('.day.sel', dir);
};

export default {
  draw(view) {
    const today = new Date().getDay();
    const days = [1, 2, 3, 4, 5, 6];
    schedDay ??= today >= 1 ? today : 1;

    const subjects = byId(state.subjects);
    const perDay = Object.fromEntries(days.map(d => [d, list(d)]));

    const tabs = days.map(d => `<button data-tab="${d}" class="${d == schedDay ? 'on' : ''}">${dayShort(d)}${perDay[d].length ? `<em>${perDay[d].length}</em>` : ''}${d == today ? '<i class="dot"></i>' : ''}</button>`).join('');

    const cols = days.map(d => {
      const items = perDay[d].map(c => {
        const s = subjects.get(c.subjectId);
        return `<div class="item cls" role="button" tabindex="0" data-id="${esc(c.id)}" style="border-color:${safeColor(s?.color)}"><div><b>${esc(s?.name || t('sched.defaultName'))}</b><span class="muted">${esc(c.start)}–${esc(c.end)}${s?.room ? ' · ' + esc(t('room', { n: s.room })) : ''}</span></div></div>`;
      }).join('');
      return `<div class="card day ${d == today ? 'is-today' : ''} ${d == schedDay ? 'sel' : ''}"><h3>${dayName(d)}</h3>${items || `<p class="muted empty">${t('sched.empty')}</p>`}<button class="add" data-day="${d}">${ic('plus')} ${t('sched.add')}</button></div>`;
    }).join('');

    view.innerHTML = `<div class="tabs">${tabs}</div><div class="week">${cols}</div>
      <button class="fab" aria-label="${t('sched.addAria')}">${ic('plus')}</button>`;
  },

  click(e) {
    const el = e.target.closest('[data-tab],[data-day],.item[data-id],.fab');
    if (!el) return;
    if (el.dataset.tab) pick(+el.dataset.tab);
    else if (el.dataset.day) editClass({ day: +el.dataset.day, ...next(+el.dataset.day) });
    else if (el.dataset.id) editClass(state.schedule.find(c => c.id === el.dataset.id));
    else editClass({ day: schedDay, ...next(schedDay) });
  },

  // Deslizar para os lados troca o dia (celular)
  touchstart(e) {
    if (e.target.closest('.week')) x0 = e.touches[0].clientX;
  },
  touchend(e) {
    if (!e.target.closest('.week')) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 60) pick(Math.min(6, Math.max(1, schedDay + (dx < 0 ? 1 : -1))));
  }
};
