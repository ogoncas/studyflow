// Idiomas: pt, en, es. Automático (idioma do navegador) ou manual; inglês é a reserva.
const KEY = 'studyflow-lang';
const FALLBACK = 'en';
const LOCALES = { pt: 'pt-BR', en: 'en-US', es: 'es' };

export const LANGS = { pt: 'Português', en: 'English', es: 'Español' };

export const dictionaries = {
  en: {
    'nav.main': 'Main',
    'nav.home': 'Home',
    'nav.schedule': 'Schedule',
    'nav.calendar': 'Calendar',
    'nav.notes': 'Notes',
    'nav.subjects': 'Subjects',
    'title.dashboard': 'Overview',
    'title.schedule': 'Class schedule',
    'title.calendar': 'Calendar',
    'title.notes': 'Notes',
    'title.subjects': 'Subjects',
    'install': 'Install app',
    'installed': 'App installed',
    'install.title': 'Install app',
    'install.text': 'Install StudyFlow on your device to open it like a regular app, even offline.',
    'install.hint': 'You can install it later in Settings.',
    'install.later': 'Not now',
    'install.unavailable': 'Not available right now. Use your browser menu (Install app or Add to home screen).',
    'install.done': 'StudyFlow is already installed on this device.',
    'language': 'Language',
    'langAuto': 'Auto',
    'settings': 'Settings',
    'settings.theme': 'Theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'about.title': 'About',
    'about.developer': 'Developer',
    'about.license': 'License',
    'about.openSource': 'Open source (MIT)',
    'donate.title': 'Support the project',
    'donate.text': 'StudyFlow is free and open source. If it helps you, you can support its development with a Pix donation (Brazil).',
    'donate.btn': 'Copy Pix key',
    'donate.copied': 'Pix key copied',
    'cal.events': 'Events this month',
    'form.close': 'Close',
    'metaDesc': 'Study organizer: class schedule, calendar, notes and grade averages.',
    'offlineNote': 'Works offline. Data is saved on this device.',
    'err.save': 'Could not save data.',

    'greet.morning': 'Good morning',
    'greet.afternoon': 'Good afternoon',
    'greet.evening': 'Good evening',
    'quote.0': 'Small steps every day go a long way.',
    'quote.1': 'Focus on the process; results will follow.',
    'quote.2': 'Studying today is freedom tomorrow.',
    'quote.3': 'Discipline beats motivation.',
    'quote.4': 'One block at a time.',

    'dash.classesToday': 'classes today',
    'dash.in7': 'in 7 days',
    'dash.subjects': 'subjects',
    'dash.today': 'Today ({day})',
    'dash.noClasses': 'No classes today.',
    'dash.upcoming': 'Upcoming deadlines',
    'dash.nothing': 'Nothing scheduled.',
    'dash.shortcuts': 'Shortcuts',
    'dash.now': 'Now',
    'new.event': 'Event',
    'new.note': 'Note',
    'new.subject': 'Subject',
    'when.today': 'today',
    'when.tomorrow': 'tomorrow',
    'when.days': 'in {n} days',
    'type.Prova': 'Exam',
    'type.Trabalho': 'Assignment',
    'type.Evento': 'Event',

    'backup.title': 'Backup',
    'backup.hint': 'Save your data to a file to keep it or move it to another device.',
    'backup.export': 'Export',
    'backup.import': 'Import',
    'backup.confirm': 'Importing replaces all current data. Continue?',
    'backup.done': 'Backup imported',
    'backup.invalid': 'Invalid backup file.',

    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.delete': 'Delete',
    'form.saved': 'Saved',
    'form.removed': 'Removed',
    'form.undo': 'Undo',
    'form.none': '— None —',

    'sched.empty': 'No classes this day.',
    'sched.add': 'Class',
    'sched.addAria': 'Add class',
    'sched.defaultName': 'Class',
    'class.edit': 'Edit class',
    'class.new': 'New class',
    'class.start': 'Start',
    'class.end': 'End',
    'class.errEnd': 'The end time must be after the start time.',
    'room': 'Room {n}',

    'cal.prev': 'Previous month',
    'cal.next': 'Next month',
    'cal.today': 'Today',
    'event.edit': 'Edit event',
    'event.new': 'New event',
    'event.title': 'Title',
    'event.date': 'Date',
    'event.type': 'Type',
    'event.errTitle': 'Enter a title.',

    'notes.compose': 'Write a note...',
    'notes.post': 'Post',
    'notes.me': 'You',
    'notes.tabAll': 'All',
    'notes.tabPinned': 'Pinned',
    'notes.pinned': 'Pinned',
    'notes.pin': 'Pin',
    'notes.unpin': 'Unpin',
    'notes.edit': 'Edit',
    'notes.emptyAll': 'No notes yet. Write the first one above.',
    'notes.emptyPinned': 'No pinned notes.',
    'notes.titlePh': 'Title',
    'notes.body': 'Note',

    'subject.label': 'Subject',
    'subject.edit': 'Edit subject',
    'subject.new': 'New subject',
    'subject.name': 'Name',
    'subject.teacher': 'Teacher',
    'subject.room': 'Room',
    'subject.color': 'Color',
    'subject.grades': 'Grades (separate with spaces)',
    'subject.errName': 'Enter a name.',
    'subject.empty': 'No subjects yet.',
    'subject.noDetails': 'No details',
    'subject.avg': 'Average {n}'
  },

  pt: {
    'nav.main': 'Principal',
    'nav.home': 'Início',
    'nav.schedule': 'Horário',
    'nav.calendar': 'Calendário',
    'nav.notes': 'Notas',
    'nav.subjects': 'Matérias',
    'title.dashboard': 'Visão geral',
    'title.schedule': 'Horário de aulas',
    'title.calendar': 'Calendário',
    'title.notes': 'Anotações',
    'title.subjects': 'Matérias',
    'install': 'Instalar app',
    'installed': 'App instalado',
    'install.title': 'Instalar app',
    'install.text': 'Instale o StudyFlow no seu dispositivo para abri-lo como um app comum, até sem internet.',
    'install.hint': 'Você pode instalar depois em Configurações.',
    'install.later': 'Agora não',
    'install.unavailable': 'Indisponível no momento. Use o menu do navegador (Instalar app ou Adicionar à tela inicial).',
    'install.done': 'O StudyFlow já está instalado neste dispositivo.',
    'language': 'Idioma',
    'langAuto': 'Auto',
    'settings': 'Configurações',
    'settings.theme': 'Tema',
    'theme.light': 'Claro',
    'theme.dark': 'Escuro',
    'theme.system': 'Sistema',
    'about.title': 'Sobre',
    'about.developer': 'Desenvolvedor',
    'about.license': 'Licença',
    'about.openSource': 'Código aberto (MIT)',
    'donate.title': 'Apoie o projeto',
    'donate.text': 'O StudyFlow é gratuito e de código aberto. Se ele te ajuda, você pode apoiar o desenvolvimento com uma doação via Pix.',
    'donate.btn': 'Copiar chave Pix',
    'donate.copied': 'Chave Pix copiada',
    'cal.events': 'Eventos do mês',
    'form.close': 'Fechar',
    'metaDesc': 'Organizador de estudos: horário de aulas, calendário, anotações e média por matéria.',
    'offlineNote': 'Funciona offline. Dados salvos neste dispositivo.',
    'err.save': 'Não foi possível salvar os dados.',

    'greet.morning': 'Bom dia',
    'greet.afternoon': 'Boa tarde',
    'greet.evening': 'Boa noite',
    'quote.0': 'Pequenos passos todos os dias levam longe.',
    'quote.1': 'Foco no processo, o resultado vem.',
    'quote.2': 'Estudar hoje é liberdade amanhã.',
    'quote.3': 'Disciplina vence motivação.',
    'quote.4': 'Um bloco de cada vez.',

    'dash.classesToday': 'aulas hoje',
    'dash.in7': 'em 7 dias',
    'dash.subjects': 'matérias',
    'dash.today': 'Hoje ({day})',
    'dash.noClasses': 'Sem aulas hoje.',
    'dash.upcoming': 'Próximas entregas',
    'dash.nothing': 'Nada agendado.',
    'dash.shortcuts': 'Atalhos',
    'dash.now': 'Agora',
    'new.event': 'Evento',
    'new.note': 'Nota',
    'new.subject': 'Matéria',
    'when.today': 'hoje',
    'when.tomorrow': 'amanhã',
    'when.days': 'em {n} dias',
    'type.Prova': 'Prova',
    'type.Trabalho': 'Trabalho',
    'type.Evento': 'Evento',

    'backup.title': 'Backup',
    'backup.hint': 'Salve seus dados em um arquivo para guardar ou levar a outro aparelho.',
    'backup.export': 'Exportar',
    'backup.import': 'Importar',
    'backup.confirm': 'Importar substitui todos os dados atuais. Continuar?',
    'backup.done': 'Backup importado',
    'backup.invalid': 'Arquivo de backup inválido.',

    'form.save': 'Salvar',
    'form.cancel': 'Cancelar',
    'form.delete': 'Excluir',
    'form.saved': 'Salvo',
    'form.removed': 'Removido',
    'form.undo': 'Desfazer',
    'form.none': '— Nenhuma —',

    'sched.empty': 'Sem aulas neste dia.',
    'sched.add': 'Aula',
    'sched.addAria': 'Adicionar aula',
    'sched.defaultName': 'Aula',
    'class.edit': 'Editar aula',
    'class.new': 'Nova aula',
    'class.start': 'Início',
    'class.end': 'Fim',
    'class.errEnd': 'O fim deve ser depois do início.',
    'room': 'Sala {n}',

    'cal.prev': 'Mês anterior',
    'cal.next': 'Próximo mês',
    'cal.today': 'Hoje',
    'event.edit': 'Editar evento',
    'event.new': 'Novo evento',
    'event.title': 'Título',
    'event.date': 'Data',
    'event.type': 'Tipo',
    'event.errTitle': 'Informe um título.',

    'notes.compose': 'Escreva uma nota...',
    'notes.post': 'Publicar',
    'notes.me': 'Você',
    'notes.tabAll': 'Todas',
    'notes.tabPinned': 'Fixadas',
    'notes.pinned': 'Fixada',
    'notes.pin': 'Fixar',
    'notes.unpin': 'Desafixar',
    'notes.edit': 'Editar',
    'notes.emptyAll': 'Nenhuma nota ainda. Escreva a primeira acima.',
    'notes.emptyPinned': 'Nenhuma nota fixada.',
    'notes.titlePh': 'Título',
    'notes.body': 'Anotação',

    'subject.label': 'Matéria',
    'subject.edit': 'Editar matéria',
    'subject.new': 'Nova matéria',
    'subject.name': 'Nome',
    'subject.teacher': 'Professor',
    'subject.room': 'Sala',
    'subject.color': 'Cor',
    'subject.grades': 'Notas (separe por espaço)',
    'subject.errName': 'Informe o nome.',
    'subject.empty': 'Nenhuma matéria cadastrada.',
    'subject.noDetails': 'Sem detalhes',
    'subject.avg': 'Média {n}'
  },

  es: {
    'nav.main': 'Principal',
    'nav.home': 'Inicio',
    'nav.schedule': 'Horario',
    'nav.calendar': 'Calendario',
    'nav.notes': 'Notas',
    'nav.subjects': 'Materias',
    'title.dashboard': 'Resumen',
    'title.schedule': 'Horario de clases',
    'title.calendar': 'Calendario',
    'title.notes': 'Apuntes',
    'title.subjects': 'Materias',
    'install': 'Instalar app',
    'installed': 'App instalada',
    'install.title': 'Instalar app',
    'install.text': 'Instala StudyFlow en tu dispositivo para abrirlo como una app normal, incluso sin conexión.',
    'install.hint': 'Puedes instalarla más tarde en Ajustes.',
    'install.later': 'Ahora no',
    'install.unavailable': 'No disponible ahora. Usa el menú del navegador (Instalar app o Añadir a pantalla de inicio).',
    'install.done': 'StudyFlow ya está instalado en este dispositivo.',
    'language': 'Idioma',
    'langAuto': 'Auto',
    'settings': 'Configuración',
    'settings.theme': 'Tema',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.system': 'Sistema',
    'about.title': 'Acerca de',
    'about.developer': 'Desarrollador',
    'about.license': 'Licencia',
    'about.openSource': 'Código abierto (MIT)',
    'donate.title': 'Apoya el proyecto',
    'donate.text': 'StudyFlow es gratuito y de código abierto. Si te ayuda, puedes apoyar su desarrollo con una donación por Pix (Brasil).',
    'donate.btn': 'Copiar clave Pix',
    'donate.copied': 'Clave Pix copiada',
    'cal.events': 'Eventos del mes',
    'form.close': 'Cerrar',
    'metaDesc': 'Organizador de estudios: horario de clases, calendario, apuntes y promedio por materia.',
    'offlineNote': 'Funciona sin conexión. Los datos se guardan en este dispositivo.',
    'err.save': 'No se pudieron guardar los datos.',

    'greet.morning': 'Buenos días',
    'greet.afternoon': 'Buenas tardes',
    'greet.evening': 'Buenas noches',
    'quote.0': 'Pequeños pasos cada día llevan lejos.',
    'quote.1': 'Enfócate en el proceso; el resultado llegará.',
    'quote.2': 'Estudiar hoy es libertad mañana.',
    'quote.3': 'La disciplina vence a la motivación.',
    'quote.4': 'Un bloque a la vez.',

    'dash.classesToday': 'clases hoy',
    'dash.in7': 'en 7 días',
    'dash.subjects': 'materias',
    'dash.today': 'Hoy ({day})',
    'dash.noClasses': 'Hoy no hay clases.',
    'dash.upcoming': 'Próximas entregas',
    'dash.nothing': 'Nada programado.',
    'dash.shortcuts': 'Atajos',
    'dash.now': 'Ahora',
    'new.event': 'Evento',
    'new.note': 'Nota',
    'new.subject': 'Materia',
    'when.today': 'hoy',
    'when.tomorrow': 'mañana',
    'when.days': 'en {n} días',
    'type.Prova': 'Examen',
    'type.Trabalho': 'Trabajo',
    'type.Evento': 'Evento',

    'backup.title': 'Copia de seguridad',
    'backup.hint': 'Guarda tus datos en un archivo para conservarlos o llevarlos a otro dispositivo.',
    'backup.export': 'Exportar',
    'backup.import': 'Importar',
    'backup.confirm': 'Importar reemplaza todos los datos actuales. ¿Continuar?',
    'backup.done': 'Copia importada',
    'backup.invalid': 'Archivo de copia no válido.',

    'form.save': 'Guardar',
    'form.cancel': 'Cancelar',
    'form.delete': 'Eliminar',
    'form.saved': 'Guardado',
    'form.removed': 'Eliminado',
    'form.undo': 'Deshacer',
    'form.none': '— Ninguna —',

    'sched.empty': 'Sin clases este día.',
    'sched.add': 'Clase',
    'sched.addAria': 'Añadir clase',
    'sched.defaultName': 'Clase',
    'class.edit': 'Editar clase',
    'class.new': 'Nueva clase',
    'class.start': 'Inicio',
    'class.end': 'Fin',
    'class.errEnd': 'La hora de fin debe ser posterior a la de inicio.',
    'room': 'Aula {n}',

    'cal.prev': 'Mes anterior',
    'cal.next': 'Mes siguiente',
    'cal.today': 'Hoy',
    'event.edit': 'Editar evento',
    'event.new': 'Nuevo evento',
    'event.title': 'Título',
    'event.date': 'Fecha',
    'event.type': 'Tipo',
    'event.errTitle': 'Escribe un título.',

    'notes.compose': 'Escribe una nota...',
    'notes.post': 'Publicar',
    'notes.me': 'Tú',
    'notes.tabAll': 'Todas',
    'notes.tabPinned': 'Fijadas',
    'notes.pinned': 'Fijada',
    'notes.pin': 'Fijar',
    'notes.unpin': 'Desfijar',
    'notes.edit': 'Editar',
    'notes.emptyAll': 'Aún no hay notas. Escribe la primera arriba.',
    'notes.emptyPinned': 'No hay notas fijadas.',
    'notes.titlePh': 'Título',
    'notes.body': 'Apunte',

    'subject.label': 'Materia',
    'subject.edit': 'Editar materia',
    'subject.new': 'Nueva materia',
    'subject.name': 'Nombre',
    'subject.teacher': 'Profesor',
    'subject.room': 'Aula',
    'subject.color': 'Color',
    'subject.grades': 'Notas (separadas por espacios)',
    'subject.errName': 'Escribe un nombre.',
    'subject.empty': 'Aún no hay materias.',
    'subject.noDetails': 'Sin detalles',
    'subject.avg': 'Promedio {n}'
  }
};

let lang = FALLBACK;

// Preferência salva: 'auto' ou um código de idioma
export const getPref = () => {
  try {
    const v = localStorage.getItem(KEY);
    return Object.hasOwn(LANGS, v) ? v : 'auto';
  } catch {
    return 'auto';
  }
};

// Primeiro idioma do navegador que temos; senão, inglês
const detect = () => {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of list) {
    const code = String(l || '').slice(0, 2).toLowerCase();
    if (Object.hasOwn(dictionaries, code)) return code;
  }
  return FALLBACK;
};

export function setLang(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {}
  lang = Object.hasOwn(LANGS, pref) ? pref : detect();
  document.documentElement.lang = LOCALES[lang];
}

export const locale = () => LOCALES[lang];

// Texto do idioma atual; se faltar, usa o inglês; se faltar também, a própria chave
export const t = (key, params) => {
  let s = dictionaries[lang]?.[key] ?? dictionaries[FALLBACK][key] ?? key;
  for (const k in params) s = s.replaceAll(`{${k}}`, params[k]);
  return s;
};

// Traduz o HTML estático: data-i18n (texto) e data-i18n-attr="atributo:chave,..."
export function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-attr]').forEach(e =>
    e.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':');
      e.setAttribute(attr, t(key));
    }));
  document.querySelector('meta[name=description]').content = t('metaDesc');
}
