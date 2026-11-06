import { ic } from '../icons.js';
import { state } from '../store.js';
import { t } from '../i18n.js';
import { app, esc, typeOf, todayISO, dayShort, monthLabel, dayMonthLong } from '../util.js';
import { anim } from '../ui.js';
import { editEvent } from '../editors.js';

let cursor = new Date();

export default {
  draw(view) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();
    const today = todayISO();
    const pad = String(m + 1).padStart(2, '0');

    // Eventos do mês agrupados por data (uma passada em vez de um filtro por dia)
    const byDate = {};
    for (const e of state.events) (byDate[e.date] ||= []).push(e);

    let cells = '<div></div>'.repeat(first);
    for (let d = 1; d <= n; d++) {
      const iso = `${y}-${pad}-${String(d).padStart(2, '0')}`;
      const chips = (byDate[iso] || [])
        .map(e => `<span class="chip t-${typeOf(e.type)}" role="button" tabindex="0" data-id="${esc(e.id)}">${esc(e.title)}</span>`).join('');
      cells += `<div class="d${iso === today ? ' today' : ''}" role="button" tabindex="0" aria-label="${dayMonthLong(new Date(y, m, d))}" data-date="${iso}">${d}${chips}</div>`;
    }

    view.innerHTML = `<div class="bar"><button data-cal="-1" id="calPrev" aria-label="${t('cal.prev')}">${ic('left')}</button><b>${monthLabel(cursor)}</b>
      <div><button data-cal="0" id="calToday">${t('cal.today')}</button><button data-cal="1" id="calNext" aria-label="${t('cal.next')}">${ic('right')}</button></div></div>
      <div class="cal">${[0, 1, 2, 3, 4, 5, 6].map(d => `<b class="muted">${dayShort(d)}</b>`).join('')}${cells}</div>`;
  },

  click(e) {
    const nav = e.target.closest('[data-cal]');
    if (nav) {
      const dir = +nav.dataset.cal;
      cursor = dir ? new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1) : new Date();
      app.render();
      if (dir) anim('.cal', dir);
      return;
    }
    const cell = e.target.closest('.d');
    if (!cell) return;
    const chip = e.target.closest('.chip');
    editEvent(chip ? state.events.find(x => x.id === chip.dataset.id) : { date: cell.dataset.date, type: 'Prova' });
  }
};
