# StudyFlow

Organizador de estudos que roda no navegador e pode ser instalado como app no PC e no Android: horário de aulas, calendário de provas e trabalhos, anotações e matérias com média de notas. Funciona offline e os dados ficam salvos no próprio dispositivo (`localStorage`), sem conta nem servidor.

## Recursos

- **Início:** aulas do dia (com marcação de "Agora"), próximas entregas e atalhos para criar itens.
- **Horário:** grade semanal de segunda a sábado, com sugestão de horário após a última aula.
- **Calendário:** provas, trabalhos e eventos por data.
- **Notas:** anotações com salvamento automático, ligadas a uma matéria.
- **Matérias:** professor, sala, cor e média calculada a partir das notas.
- **Backup:** exporta e importa todos os dados em um arquivo JSON.
- **Desfazer** ao excluir, tema claro/escuro e layout responsivo (navegação inferior e gesto de deslizar no celular).

## Como usar

### Online

Acesse **[ogoncas.github.io/studyflow](https://ogoncas.github.io/studyflow/)**, sem instalar nada.

### Instalar como app

- **Android (Chrome):** abra o site, toque em **Instalar app** (no topo da tela) ou em ⋮ → **Instalar app**.
- **PC (Chrome ou Edge):** clique em **Instalar app** (no topo da tela) ou no ícone de instalação na barra de endereço.

Depois de instalado, abre em janela própria e funciona sem internet.

### Localmente

O projeto usa módulos ES e service worker, então precisa ser aberto por um servidor local (abrir o `index.html` direto não funciona):

```bash
git clone https://github.com/ogoncas/studyflow.git
cd studyflow
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. O GitHub serve o site em HTTPS, requisito para instalar o app no Android.

## Estrutura

```
index.html
manifest.webmanifest   # dados do app instalável
sw.js                  # service worker (offline)
css/style.css
js/app.js              # telas, formulários, navegação e instalação
js/store.js            # estado, persistência e backup
js/icons.js            # ícones SVG inline
icons/                 # ícones do app (PNG, maskable e SVG)
screenshots/           # imagens do diálogo de instalação
```

## Licença

[MIT](LICENSE)
