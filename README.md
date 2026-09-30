# Playbook WR

App de treino, alimentação, água e evolução para um jogador de futebol americano (wide receiver).
É um PWA em JavaScript puro, sem framework: funciona no navegador, pode ser instalado na tela inicial do iPhone e guarda os dados no próprio aparelho.

## O que ele faz
- **Hoje:** treino do dia, campo de calorias, próxima refeição, água com quantidade exata, dados do relógio e atividade opcional (flag às quartas, 20h).
- **Treino:** Academia A/B/C, campo, treino do time e descanso. Séries com carga e repetições, cronômetro de descanso, sugestão de carga, bi-set com duas cargas, resumo com recordes.
- **Comida:** cardápio em medidas caseiras (sem balança), ajuste por porção, "fora do plano" e cadastro dos seus alimentos.
- **Evolução:** resumo da semana, peso, força, recuperação, testes de campo e consistência.
- **Perfil:** metas por tipo de dia, ciclo de 4 semanas (semana 4 = descarga), backup e tema.

## Começando

Precisa de **Node 20 ou mais novo**. Python só é necessário se você for mexer na planilha ou nos dados dos treinos.

```bash
npm install
npm run build      # monta o site em dist/site e o arquivo único dist/playbook-wr.html
npm test           # roda todos os testes (leva cerca de 1 minuto)
npm run serve      # abre http://localhost:5173 com o site montado
```

Para a planilha e os dados dos treinos (opcional):

```bash
pip install -r requirements.txt
npm run data       # gera a planilha em dist/ e atualiza data/training.json e data/app-data.json
npm run build
```

## Estrutura

```
src/
  index.html                          modelo da página (marcadores <!--@...--> são preenchidos no build)
  css/styles.css                      todo o visual
  js/00-core.js                       utilidades, estado, armazenamento, cálculos, cronômetro
  js/10-telas-hoje-treino.js          telas Hoje e Treino (séries, bi-set, flag)
  js/20-telas-comida-evolucao-perfil.js   telas Comida, Meus alimentos, Evolução e Perfil
  js/90-acoes.js                      cliques, alterações de campos e inicialização
  assets/                             logo
public/                               ícones, manifest e service worker
data/
  foods.py, units.py                  alimentos, medidas caseiras e os 3 cardápios
  training.json                       exercícios (gerado por spreadsheet/build_xlsx.py)
  app-data.json                       tudo que o app lê (gerado por scripts/export_data.py)
scripts/                              build.mjs, serve.mjs, export_data.py
spreadsheet/build_xlsx.py             gera a planilha e o training.json
tests/                                testes com JSDOM (relógio simulado: quarta-feira, 18h)
watch/                                projeto do Redmi Watch (Xiaomi Vela JS, não testado em relógio real)
docs/                                 arquitetura, deploy e backlog
```

## Fluxo de trabalho

1. Edite os arquivos em `src/` (nunca em `dist/`).
2. `npm run build` e `npm test`.
3. Confira no navegador com `npm run serve`.
4. Publique (veja `docs/DEPLOY.md`).

Se você usa o **Claude Code**, leia o `CLAUDE.md`: ele explica o projeto, os cuidados e os comandos. Há também atalhos em `.claude/commands/`: `/verificar`, `/novo-alimento` e `/publicar`.

## Primeiros pedidos sugeridos ao Claude Code
- "Rode `/verificar` e me diga se está tudo funcionando."
- "Faça o item 1 do `docs/BACKLOG.md` (privacidade) e mantenha os testes passando."
- "Ligue o projeto ao GitHub e à Vercel seguindo o `docs/DEPLOY.md`."
- "Adicione o alimento X com estes valores do rótulo: ..." (use `/novo-alimento`).

## Aviso
As metas de calorias e macros vêm de fórmulas de estimativa e os valores de alimentos são aproximados. Isto é um material de apoio, não substitui nutricionista, preparador físico ou médico.
