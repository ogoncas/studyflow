# Segurança

O StudyFlow roda inteiramente no navegador: não há servidor, conta, rastreamento nem requisições a terceiros. Os dados ficam no `localStorage` do próprio aparelho.

## Medidas

- **CSP restritiva** (`index.html` e `_headers`): só scripts e estilos do próprio site, sem `eval` nem scripts inline, sem plugins e sem conexões externas.
- **Saída segura:** todo texto dos dados passa por escape antes de ir para o HTML; cores e tipos são validados.
- **Dados validados na entrada:** o que vem do armazenamento, de um backup importado ou dos formulários é normalizado (campos conhecidos, tipos, tamanhos, datas, horas, cores, ids únicos e limite de itens). Backups acima de 5 MB são recusados.
- **Service worker:** só trata requisições GET do próprio site e só guarda respostas normais.
- **Links externos** usam `rel="noopener noreferrer"`; `Referrer-Policy: no-referrer`.

## Boas práticas de front-end: o que se aplica

| Prática | Situação |
|---|---|
| XSS | Todo texto vindo de dados passa por `esc()` antes de ir ao HTML; cores e tipos são validados; a CSP bloqueia scripts inline. Sem bibliotecas externas, não há DOMPurify: o app nunca renderiza HTML de terceiros. |
| CSRF | Não se aplica: não há servidor, sessão nem requisições que alterem dados remotos. |
| Clickjacking | `frame-ancestors 'none'` e `X-Frame-Options: DENY` em `_headers`. Onde não há cabeçalhos (GitHub Pages), `js/boot.js` esconde a página se ela estiver dentro de um iframe. |
| HTTPS / HSTS | `upgrade-insecure-requests` na CSP e redirecionamento para HTTPS fora de localhost. HSTS em `_headers` (o GitHub Pages já força HTTPS ao ativar "Enforce HTTPS"). |
| CSP | Ativa em `index.html` e `_headers`: tudo só do próprio site. |
| CORS | Não se aplica: o app não tem API e não faz requisições a outros domínios (`connect-src 'self'`). |
| Cookies / tokens | Não se aplica: não há login nem tokens. O `localStorage` guarda só os dados do próprio usuário. |
| Segredos no código | Nenhum. A chave Pix de doação é pública por natureza. |
| Validação no back-end | Não há back-end; a validação é refeita ao carregar dados e ao importar backups (`js/store.js`). |
| SRI | Não se aplica: nenhum script ou estilo vem de CDN. |
| Auditoria de pacotes | Não se aplica: sem dependências nem `package.json`. |

## Limites

Qualquer pessoa com acesso ao navegador do aparelho pode ler o `localStorage`; os dados não são criptografados. Para se proteger disso, use o bloqueio do sistema e evite aparelhos compartilhados.

## Relatar uma vulnerabilidade

Abra uma issue em https://github.com/ogoncas/studyflow/issues ou, para algo sensível, use os "Security advisories" do repositório.
