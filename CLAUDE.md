# CLAUDE.md — Playbook WR

Guia para trabalhar neste projeto. Responda e escreva textos da interface em **português do Brasil**.

## O que é
PWA de treino, alimentação, água e evolução para um wide receiver de futebol americano (treino do time aos sábados, flag football opcional às quartas às 20h). JavaScript puro, sem framework e sem dependências em tempo de execução no app. A única parte de servidor é `api/foto.js` (função da Vercel para a foto do prato), que usa o SDK oficial `@anthropic-ai/sdk`. O dono usa principalmente no **iPhone** (instalado na tela inicial) e quer entregas completas, sem ficar voltando com perguntas.

## Comandos
```bash
npm install
npm run build     # src/ + data/ -> dist/site (publicar) e dist/playbook-wr.html (arquivo único)
npm test          # 13 arquivos de teste, cerca de 215 verificações, JSDOM
npm run serve     # http://localhost:5173
npm run data      # (Python, via scripts/py.mjs) planilha + training.json + app-data.json
npm run data:app  # (Python, via scripts/py.mjs) só app-data.json, a partir de foods.py, units.py, training.json e taco.json
npm run data:taco # (Python) extrai data/taco.json da planilha oficial da TACO e refaz app-data.json
```
**Sempre rode `npm run build && npm test` antes de dizer que terminou.** Edite `src/` e `data/`; `dist/` é gerado e fica fora do Git.

## Mapa do código
- `src/js/00-core.js`: utilidades (`$`, `esc`, `nf`, datas), estado global `S`, `Store` (armazenamento), metas (`targets()`), comida (`FOOD`, `UN`, `mac`, `fmtQty`, `consumed`), ciclo de 4 semanas, cronômetro de descanso.
- `src/js/10-telas-hoje-treino.js`: `vHoje`, `vTreino`, `gymHtml` (séries), `PAIRS` (bi-set), atividade opcional `FLAG`, `weekCard`.
- `src/js/20-telas-comida-evolucao-perfil.js`: `vComida`, "Meus alimentos" (`customCard`, `regCustom`, `seedCustom`), `vEvol`, `vPerfil`, `vSetup` (configuração inicial), backup (`bkFile`, `bkCopy`, `restoreBackup`, `bkDue`), tendência do peso (`trend`, `trendHtml`), lembretes do iPhone (`remindersHtml`), Tabela TACO (`tacoCard`, `tacoFind`, `tacoResults`) e código de barras (`barFind`, `scaleBase`).
- `api/foto.js`: função da Vercel. Recebe a foto (base64), confere `x-app-code` contra `APP_CODE` e pergunta ao Claude (`claude-opus-5-5`, JSON garantido por `json_schema`, lista base + TACO no system prompt com cache). Sem as variáveis `ANTHROPIC_API_KEY`/`APP_CODE` responde 503.
- Foto no app (`20-telas...js`): `fotoCard`, `fotoSend`, `shrinkImage`, `fotoMac`, `fotoSetupHtml`. O código de acesso fica em `localStorage` (`wr_foto_code`), fora do backup.
- `src/js/90-acoes.js`: um `click`, um `change` e um `input` no `document` (delegação por `data-act`) e a inicialização.
- As telas são funções que **devolvem uma string HTML**; `view()` troca o `innerHTML` de `#view`. Toda ação altera `S`/o dia, chama `saveDay(...)` e depois `view()`.
- O build junta os 4 arquivos JS na ordem do nome. Eles compartilham o escopo global (não há módulos).

## Dados e armazenamento
Veja `docs/ARQUITETURA.md` para o formato completo. Resumo:
- Chave do navegador: `wr_playbook_v1` (localStorage). Dentro do Claude (artefato) usa `claude.use('db')`; se nada disponível, fica só em memória.
- Por dia: `d_AAAA-MM-DD` com `eaten`, `extras`, `water`/`wlog`, `sets`, `done`, `chk`, `meals`, `health`, `t0`/`dur`, `notes`.
- Perfil em `profile` (inclui `custom`, os alimentos do usuário).
- Não quebre dados antigos: campos novos devem ser opcionais e ter valor padrão.

## Regras e cuidados que já custaram tempo
1. **Nunca use `String.replace` com texto dinâmico sem função.** O JS do app tem `$&`, que o `replace` interpreta. O `build.mjs` usa `put(texto, marcador, () => novo)`.
2. **Campos de texto precisam de fonte de 16 px ou mais** (no iPhone o Safari dá zoom abaixo disso).
3. Toda ação que muda a tela recria o HTML: valores digitados e não salvos se perdem. Campos de série salvam no evento `change`.
4. **Números em pt-BR:** use `nf(valor, casas)`. Plural: "0,5 copo", "1,5 copos" (plural só acima de 1).
5. `sessOf(dia)` decide o treino do dia pela semana. `FLAG` é uma sessão "virtual" (`allSess()`), não entra em `SESSIONS`.
6. O cronômetro da sessão (`t0`) é por dia, não por treino.
7. Os cardápios são guardados em **gramas**; a interface mostra medidas caseiras (`UN[nome] = [singular, plural, g por unidade, passo, o nome já é o alimento?, rótulo curto]`).
8. O service worker usa rede primeiro e cai para o cache; a versão do cache é gerada a cada build (`__BUILD__`).
9. Safe areas do iPhone: `viewport-fit=cover` e `env(safe-area-inset-*)`. Mantenha os botões com pelo menos 44 px.
10. **Testes:** o relógio é simulado (quarta, 18h) por `tests/helpers.js`, então passam em qualquer dia. Ao criar teste novo, use `mockDate` e grave um perfil com `seedStore(w, seed)` (sem perfil o app mostra a configuração inicial).
11. **Scripts Python no Windows:** abra arquivos com `encoding="utf-8"` (e `newline="\n"` ao gravar), senão o JSON sai corrompido ou com CRLF. Rode-os pelo `npm run data` (o `scripts/py.mjs` acha `python3`, `python` ou `py`).
12. **`<details>` e box-sizing:** o conteúdo de `<details>` não herda o `box-sizing`; por isso há uma regra `details *{box-sizing:border-box}`. Sem ela, botões `block` passam da largura da tela.
13. **Tendência do peso só sugere.** O ajuste só acontece no toque em "Aplicar sugestão" (`trend-apply`), que soma nos fatores de atividade e grava `trendAdj`.
14. **TACO e código de barras:** `TACO[nome]` fica fora de `FOOD` (um alimento de "Meus alimentos" com o mesmo nome tem prioridade em `mac()`). A busca atualiza só `#tres` no evento `input`, sem `view()`, para o teclado do iPhone não fechar. O código de barras só **preenche** o formulário (`S.prefill`, `S.formBase`); quem salva é o usuário. Nos testes, simule `fetch` (veja `tests/taco.test.js`).
15. **Foto do prato:** nunca chame a API de verdade nos testes (`tests/fotoapi.test.js` injeta um cliente falso via `makeHandler`; `tests/foto.test.js` simula `fetch` e `shrinkImage`). Extras estimados pela foto guardam `m` (kcal/macros por 100 g); some sempre com `exMac(e)`, não `mac(e.f, e.g)`.

## Como fazer mudanças comuns
- **Novo alimento da base:** `data/foods.py` + `data/units.py` (mesmo nome), depois `npm run data:app`. Atalho: `/novo-alimento`.
- **Mudar exercícios, campo ou aquecimento:** o conteúdo está em `spreadsheet/build_xlsx.py` (ele gera também `data/training.json`). Rode `npm run data`.
- **Novo exercício com duas cargas:** inclua o nome exato em `PAIRS` (em `10-telas-hoje-treino.js`).
- **Nova atividade opcional (como o flag):** siga `FLAG`, `OPT_ITEMS`, `optHtml`, o cartão em `vHoje` e a regra `kind === 'opt'` em `sessProgress`/`vTreino`.
- **Nova aba:** botão em `src/index.html`, função `vNome()` e entrada no mapa dentro de `view()` (`90-acoes.js`), além de `go()`/hash.
- **Nova ação de clique:** `data-act="nome"` no HTML e um `if(a==='nome')` no `click` de `90-acoes.js`.

## Privacidade
**Nunca coloque dados pessoais do dono (peso, altura, idade, medidas) no código, nos testes ou na documentação.** O repositório pode ser público.
- `DEFAULT_PROFILE` é neutro. Sem perfil salvo o app abre a configuração inicial (`vSetup`, `S.needSetup`); nada é gravado antes de concluí-la.
- Testes usam o perfil fictício de `tests/helpers.js` (`seedStore`/`withProfile`).
- A planilha lê o perfil de `spreadsheet/perfil.local.json` (fora do Git; `*.local.json` no `.gitignore`).

## Publicação
Veja `docs/DEPLOY.md`. A Vercel monta o site sozinha com `npm run build` e publica `dist/site`. `dist/hashes.txt` lista o sha1 de cada arquivo para conferir o que foi ao ar.

## Estilo
- Comentários e textos em português. Nomes de funções curtos e já existentes (`vHoje`, `gymHtml`...).
- Não introduza framework, bundler novo nem dependência de execução sem pedir.
- Prefira mudanças pequenas e testadas. Acrescente teste em `tests/` para o que for novo.
