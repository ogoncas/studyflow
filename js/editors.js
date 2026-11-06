import { state, save, newId } from './store.js';
import { t } from './i18n.js';
import { TYPES, typeLabel } from './util.js';
import { form, del } from './ui.js';

export const subjOpts = () => [['', t('form.none')], ...state.subjects.map(s => [s.id, s.name])];

export const editClass = item => form(item.id ? t('class.edit') : t('class.new'), [
  { n: 'subjectId', l: t('subject.label'), t: 'select', o: subjOpts() },
  { n: 'start', l: t('class.start'), t: 'time', d: '08:00', r: 1 },
  { n: 'end', l: t('class.end'), t: 'time', d: '09:00', r: 1 }
], item,
  d => {
    if (d.end <= d.start) throw new Error(t('class.errEnd'));
    return save('schedule', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('schedule', item)));

export const editEvent = item => form(item.id ? t('event.edit') : t('event.new'), [
  { n: 'title', l: t('event.title'), r: 1 },
  { n: 'date', l: t('event.date'), t: 'date', r: 1 },
  { n: 'type', l: t('event.type'), t: 'select', o: TYPES.map(x => [x, typeLabel(x)]) }
], item,
  d => {
    if (!d.title.trim()) throw new Error(t('event.errTitle'));
    return save('events', { ...item, ...d, id: item.id || newId() });
  },
  item.id && (() => del('events', item)));

export const editSubject = item => form(item.id ? t('subject.edit') : t('subject.new'), [
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
