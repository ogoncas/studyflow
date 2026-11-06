import { ic } from './icons.js';
import { remove, save } from './store.js';
import { t } from './i18n.js';
import { $, app, esc, options } from './util.js';

export const dlg = $('#dlg');
export const dlgForm = $('#dlgForm');

export const shut = () => {
  dlg.classList.add('out');
  setTimeout(() => {
    dlg.close();
    dlg.classList.remove('out');
  }, 180);
};

// Desliza o elemento para o lado do clique (dir = 1 ou -1)
export const anim = (sel, dir) => {
  const e = $(sel);
  e.style.setProperty('--dir', dir);
  e.classList.add('slide');
};

// Aviso temporário; opts.action = { label, run } adiciona um botão (ex.: Desfazer)
export const toast = (msg, opts = {}) => {
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
export async function del(col, item) {
  await remove(col, item.id);
  app.render();
  toast(t('form.removed'), { action: { label: t('form.undo'), run: async () => { await save(col, item); app.render(); } } });
}

// Formulário genérico no diálogo único
export function form(title, fields, item, onOk, onDel) {
  dlg.setAttribute('aria-label', title);
  dlgForm.className = '';
  dlgForm.innerHTML = `<h3>${title}</h3>` + fields.map(f => `<label>${f.l}` +
    (f.t === 'select'
      ? `<select name="${f.n}">${options(f.o)}</select>`
      : `<input name="${f.n}" type="${f.t || 'text'}" autocomplete="off"${f.p ? ` placeholder="${f.p}"` : ''}${f.r ? ' required' : ''}>`) +
    `</label>`).join('') +
    `<p class="err" role="alert"></p><div class="row">` +
    (onDel ? `<button type="button" class="danger" id="dlgD" data-do="del">${t('form.delete')}</button>` : '') +
    `<button type="button" id="dlgX" data-do="cancel">${t('form.cancel')}</button><button class="primary">${t('form.save')}</button></div>`;

  fields.forEach(f => dlgForm.elements[f.n].value = item?.[f.n] ?? f.d ?? '');

  dlgForm.onchange = null;
  dlgForm.onclick = async e => {
    const act = e.target.closest('[data-do]')?.dataset.do;
    if (act === 'cancel') shut();
    else if (act === 'del') {
      await onDel();
      shut();
    }
  };
  dlgForm.onsubmit = async e => {
    e.preventDefault();
    const btn = dlgForm.querySelector('.primary');
    btn.disabled = true;
    try {
      const msg = await onOk(Object.fromEntries(new FormData(dlgForm)));
      shut();
      app.render();
      toast(msg || t('form.saved'));
    } catch (x) {
      dlgForm.querySelector('.err').textContent = x.message;
      btn.disabled = false;
    }
  };
  if (!dlg.open) dlg.showModal();
}

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
