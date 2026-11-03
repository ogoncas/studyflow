# StudyFlow

Organizador de estudos que roda direto no navegador: horário de aulas, calendário de provas e trabalhos, anotações e matérias com média de notas. Os dados ficam salvos no próprio dispositivo (`localStorage`), sem conta nem servidor.

## Recursos

- **Início:** aulas do dia, próximas entregas e atalhos.
- **Horário:** grade semanal de segunda a sábado, com sugestão de horário após a última aula.
- **Calendário:** provas, trabalhos e eventos por data.
- **Notas:** anotações livres, ligadas a uma matéria.
- **Matérias:** professor, sala, cor e média calculada a partir das notas.
- **Tema claro e escuro** e **layout responsivo**, com navegação inferior e gesto de deslizar no celular.

## Como usar

### Online

Acesse **[ogoncas.github.io/studyflow](https://ogoncas.github.io/studyflow/)**, sem instalar nada.

### Localmente

O projeto usa módulos ES, então precisa ser aberto por um servidor local (abrir o `index.html` direto não funciona):

```bash
git clone https://github.com/ogoncas/studyflow.git
cd studyflow
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura

```
index.html
css/style.css
js/app.js     # telas, formulários e navegação
js/store.js   # estado e persistência (localStorage)
js/icons.js   # ícones SVG inline
```

## Licença

[MIT](LICENSE)
