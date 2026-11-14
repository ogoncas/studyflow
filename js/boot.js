// Aplica o tema antes da primeira pintura (evita piscar); fica em arquivo próprio por causa da CSP
try {
  document.documentElement.dataset.theme = localStorage.getItem('studyflow-theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
} catch (e) {}
