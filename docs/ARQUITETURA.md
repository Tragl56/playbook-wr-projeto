# Arquitetura

## Visão geral
```
data/*.py + data/training.json ──(npm run data)──▶ data/app-data.json ─┐
src/index.html + src/css + src/js ─────────────────────────────────────┴─(npm run build)─▶ dist/site  (publicar)
                                                                                          └▶ dist/playbook-wr.html (arquivo único)
```
Sem framework: as telas são funções que devolvem HTML (template strings). `view()` escolhe a função da aba atual e troca o `innerHTML` de `#view`.

## Estado em memória (`S`)
```js
S = {
  profile,              // veja abaixo
  weights: [{d:'2026-09-30', kg:80}],
  tests:   [{d, s10, s40, vj, ag}],        // 10 jardas, 40 jardas, salto vertical, 5-10-5
  days:    { '2026-09-30': { ...dia } },
  tab, sess, planView, open:{}, exOpen:{}, // estado de tela (não é salvo)
  editFood, delFood,                       // edição em "Meus alimentos" (não é salvo)
  needSetup                                // true enquanto não há perfil salvo (não é salvo)
}
```

### Perfil (`S.profile`)
`peso, altura, idade, sexo, obj ('Definir'|'Manter'|'Ganhar massa'), prot (g/kg), fat{treino,sab,desc}, carb{treino,sab,desc} (g/kg), agua (ml/kg), cycleStart ('AAAA-MM-DD' da segunda da semana 1), custom[], customSeeded, pf (não usado)`.

Campos opcionais: `lastBackup` (data do último backup salvo ou copiado), `bkSnooze` (até quando esconder o lembrete de backup), `trendAdj: {d, dF}` (data e valor do último ajuste aplicado pela tendência do peso; a tendência só usa pesagens a partir dessa data).

**Tendência do peso (`trend()`):** reta (mínimos quadrados) das pesagens dos últimos 28 dias; precisa de 3 pesagens em 14 dias. Definir: rápido se perder 1% do peso ou mais por semana, parado se perder menos de 0,2 kg/sem. Ganhar massa: rápido acima de 0,5%/sem, parado abaixo de +0,1 kg/sem. Manter: fora de ±0,25 kg/sem. A sugestão (+~175 ou −~125 kcal) é convertida em passos de 0,05 nos fatores de atividade.

**Tabela TACO:** `D.taco` = `[nome, grupo, kcal, proteína, carboidrato, gordura]` por 100 g (593 alimentos; `D.tacoCats` = nomes dos grupos). Gerada por `scripts/taco.py` a partir da planilha oficial (NEPA/UNICAMP, 4ª edição), conferida por SHA1; alimentos sem energia analisada ("*") ficam de fora. No app vira o mapa `TACO`, usado por `mac()` quando o nome não está em `FOOD`. Extras da TACO são gravados como `{f: nome, g: gramas}`.

**Código de barras:** `barFind()` consulta `https://world.openfoodfacts.org/api/v2/product/<código>.json` (sem chave; libera acesso de outros sites) e preenche o formulário de "Meus alimentos" com a porção do rótulo (`serving_quantity`) ou 100 g. `S.prefill` guarda os valores mostrados e `S.formBase` os valores por 100 g, para recalcular quando o tamanho da unidade muda.

**Backup:** `Store.blob()` em JSON. "Salvar arquivo" usa o compartilhamento do sistema (`navigator.share` com arquivo) e, se não houver, baixa o arquivo. O lembrete na aba Hoje aparece com 30 dias sem backup, só quando os dados ficam no aparelho.

**Configuração inicial:** o código traz só um perfil neutro (`DEFAULT_PROFILE`). Sem perfil salvo, `S.needSetup` fica `true`: `view()` mostra `vSetup()` (peso, altura, idade, sexo, objetivo ou restaurar backup), a barra de abas some (`body.setup`) e `Store.save` não grava nada. Ao concluir (`setup-save`), o perfil é gravado e o peso informado vira a primeira pesagem. Qualquer perfil já salvo (`applyLoaded`) desliga a configuração.

`custom[]` são os "Meus alimentos": `{id, n, u, ug, m, k, p, c, g}` = nome, unidade, tamanho de 1 unidade, medida (`g` ou `ml`) e kcal/proteína/carbo/gordura **de uma unidade**.

### Dia (`S.days['AAAA-MM-DD']`)
| campo | conteúdo |
|---|---|
| `eaten` | `{ '0': true, ... }` refeições marcadas (índice na lista do tipo de dia) |
| `meals` | `{ '0': [[alimento, gramas], ...] }` refeições ajustadas pelo usuário (se não existir, vale o plano) |
| `extras` | `[{f: alimento, g: gramas}]` "fora do plano" |
| `water`, `wlog` | água em ml e lista dos últimos incrementos (para "desfazer") |
| `sets` | `{ slug: [{kg, reps, done, kg2?, reps2?}] }` por exercício; `kg2/reps2` só nos bi-sets |
| `done` | `{ 'A'|'T'|'B'|'C'|'S'|'SAB'|'DOM'|'FLAG': true }` sessões concluídas |
| `chk` | checklists (`AQ-i` aquecimento do time, `DOM-i`, `OPT-i` flag, `WU-X` aquecimento da academia, `T-i`/`S-i` blocos de campo) |
| `health` | `{sleep, rhr, kcal, hravg, hrmax}` digitados a partir do relógio |
| `t0`, `dur` | início do cronômetro da sessão (ms) e duração por sessão (min) |
| `notes` | `{ idDaSessão: 'texto' }` |

`slug(nome)` gera a chave do exercício (minúsculas, sem acento, `_`).

## Armazenamento (`Store`)
Três modos, escolhidos em `Store.init()`:
1. **cloud:** dentro do Claude, `claude.use('db')` com uma coleção por usuário (`data/users/<id>`), um documento por chave (`profile`, `weights`, `tests`, `d_AAAA-MM-DD`).
2. **local:** `localStorage['wr_playbook_v1']` com um objeto `{ profile, weights:{list}, tests:{list}, 'd_AAAA-MM-DD': {...} }`.
3. **memory:** nada disponível; os dados somem ao fechar (a tela avisa).

`applyLoaded(obj)` mistura o que foi lido com os padrões: campos novos precisam ter valor padrão para não quebrar quem já tem dados salvos. O backup (Perfil) é esse mesmo objeto em JSON.

## Comida
- `D.foods`: `[nome, kcal, prot, carbo, gord, texto da medida]` por 100 g/ml. `FOOD[nome]` é o mesmo em objeto.
- `D.plans.{treino,sab,desc}`: `[[nome da refeição, horário, [[alimento, gramas], ...]], ...]`.
- `D.units[nome]`: `[singular, plural, gramas por unidade, passo, o nome da unidade já é o alimento?, rótulo curto]`. A interface converte gramas em unidades (`fmtQty`).
- "Meus alimentos" entram em `FOOD`/`UN` por `regCustom()` (chamado em todo `view()`), convertendo os valores de uma unidade para "por 100 g".
- `consumed(data)` soma as refeições marcadas (usando `meals` se houver ajuste) e os `extras`.

## Treino
- Sessões: `A` (seg), `T` (ter, campo), `B` (qua), `C` (qui), `S` (sex, campo), `SAB` (time), `DOM` (descanso) e `FLAG` (opcional, quarta às 20h).
- Semana 4 do ciclo = descarga: uma série a menos e carga sugerida a 90%.
- Sugestão de carga: `lastSet(slug)` devolve a série mais pesada do treino anterior.
- Bi-set: exercícios listados em `PAIRS` têm uma segunda linha por série (`kg2`, `reps2`).

## Metas (`targets()`)
TMB (Mifflin-St Jeor) × fator de atividade por tipo de dia × ajuste do objetivo; proteína por kg; carboidrato por kg; gordura pelo que sobra. Fórmulas em `00-core.js`.

## Build (`scripts/build.mjs`)
- Junta `src/js/*` em 4 arquivos (`app1-4.js`), minifica com Terser, minifica o CSS com clean-css e o HTML com html-minifier-terser.
- Gera `data.js` (`var D=...`), copia `public/`, grava a versão do cache no `sw.js` e escreve `dist/hashes.txt`.
- Gera também `dist/playbook-wr.html` (arquivo único, legível), que os testes usam.

## Testes (`tests/`)
JSDOM com relógio simulado. `npm test` roda `tests/run.js`, que executa cada `*.test.js` e falha se houver `FALHA` ou erro de JavaScript.
`food` (cardápio), `treino` (séries e resumo), `agua`, `custom` (meus alimentos), `flag` (opcional das quartas), `pair` (bi-set) e `dist` (consistência do build).
