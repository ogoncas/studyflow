// Roda antes da primeira pintura; fica em arquivo próprio por causa da CSP

// Clickjacking: dentro de um <iframe> de outro site, a página some (a CSP em <meta> não aceita frame-ancestors)
if (window.top !== window.self) document.documentElement.style.display = 'none';

// HTTPS obrigatório: fora de localhost, troca http por https
if (location.protocol === 'http:' && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  location.replace('https:' + location.href.slice(5));
}

// Aplica o tema (evita piscar)
try {
  document.documentElement.dataset.theme = localStorage.getItem('studyflow-theme') ||
    (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
} catch (e) {}
