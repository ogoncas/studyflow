# Segurança

O StudyFlow roda inteiramente no navegador: não há servidor, conta, rastreamento nem requisições a terceiros. Os dados ficam no `localStorage` do próprio aparelho.

## Medidas

- **CSP restritiva** (`index.html` e `_headers`): só scripts e estilos do próprio site, sem `eval` nem scripts inline, sem plugins e sem conexões externas.
- **Saída segura:** todo texto dos dados passa por escape antes de ir para o HTML; cores e tipos são validados.
- **Dados validados na entrada:** o que vem do armazenamento, de um backup importado ou dos formulários é normalizado (campos conhecidos, tipos, tamanhos, datas, horas, cores, ids únicos e limite de itens). Backups acima de 5 MB são recusados.
- **Service worker:** só trata requisições GET do próprio site e só guarda respostas normais.
- **Links externos** usam `rel="noopener noreferrer"`; `Referrer-Policy: no-referrer`.

## Limites

Qualquer pessoa com acesso ao navegador do aparelho pode ler o `localStorage`; os dados não são criptografados. Para se proteger disso, use o bloqueio do sistema e evite aparelhos compartilhados.

## Relatar uma vulnerabilidade

Abra uma issue em https://github.com/ogoncas/studyflow/issues ou, para algo sensível, use os "Security advisories" do repositório.
