import { ic } from '../icons.js';
import { state } from '../store.js';
import { t } from '../i18n.js';
import { $, app, esc, safeColor, typeOf, typeLabel, TYPE_COLORS, byId, byStart, isDate, todayISO, daysUntil, fmtDate, inDays, greet, dayName } from '../util.js';
import { editEvent, editSubject } from '../editors.js';

export default {
  draw(view) {
    const day = new Date().getDay();
    const hm = new Date().toTimeString().slice(0, 5);
    const today = todayISO();
    const subjects = byId(state.subjects);
    const classes = state.schedule.filter(c => c.day == day).sort(byStart);
    const upcoming = state.events.filter(e => isDate(e.date) && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const week = upcoming.filter(e => daysUntil(e.date) <= 7).length;

    const classHtml = classes.map(c => {
      const s = subjects.get(c.subjectId);
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
  },

  click(e) {
    const go = e.target.closest('[data-go]');
    if (go) return app.go(go.dataset.go);
    const k = e.target.closest('[data-new]')?.dataset.new;
    if (k === 'event') editEvent({ date: todayISO(), type: 'Prova' });
    else if (k === 'subject') editSubject({});
    else if (k === 'note') {
      app.go('notes');
      $('#cText')?.focus();
    }
  }
};
