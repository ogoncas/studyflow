import { ic } from '../icons.js';
import { state } from '../store.js';
import { t } from '../i18n.js';
import { esc, safeColor, avg } from '../util.js';
import { editSubject } from '../editors.js';

export default {
  draw(view) {
    const cards = state.subjects.map(s => {
      const info = [s.teacher, s.room && t('room', { n: s.room })].filter(Boolean).map(esc).join(' · ');
      return `<div class="card" role="button" tabindex="0" data-id="${esc(s.id)}" style="border-top:4px solid ${safeColor(s.color)}">
        <h3>${esc(s.name)}</h3><p class="muted">${info || t('subject.noDetails')}</p><span class="badge">${t('subject.avg', { n: avg(s.grades) })}</span></div>`;
    }).join('');

    view.innerHTML = `<div class="top"><button class="primary" id="sNew">${ic('plus')} ${t('subject.new')}</button></div>
      <div class="grid">${cards || `<p class="muted">${t('subject.empty')}</p>`}</div>`;
  },

  click(e) {
    if (e.target.closest('#sNew')) return editSubject({});
    const card = e.target.closest('.card[data-id]');
    if (card) editSubject(state.subjects.find(s => s.id === card.dataset.id));
  }
};
