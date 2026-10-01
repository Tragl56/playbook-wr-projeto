# Backlog

Ordem sugerida. Cada item tem um critério para saber quando está pronto.

## 1. Privacidade: tirar os dados pessoais do código ✅ (30/09/2026)
Perfil neutro no código + tela de configuração inicial (`vSetup`). A planilha lê o perfil de `spreadsheet/perfil.local.json`, que fica fora do Git. Teste: `tests/setup.test.js`.

## 2. Repositório + Vercel por Git ✅ (30/09/2026)
Repositório `github.com/Tragl56/playbook-wr-projeto` ligado ao projeto `playbook-wr` da Vercel: cada `git push` para `main` publica o site.

## 3. Ajuste de metas pela tendência do peso ✅ (30/09/2026)
Aviso na aba Evolução (`trendHtml`), com sugestão e botão "Aplicar sugestão" (só muda no toque). Teste: `tests/trend.test.js`.

## 4. Conferir valores de comida
Ceviche e café com proteína (`seedCustom` em `20-telas-...js`) são estimativas. Trocar pelos valores do rótulo/receita do dono. Revisar também as medidas caseiras em `data/units.py` se ele disser que uma concha, escumadeira ou colher é diferente.
Agora há ferramentas para isso no app: **código de barras** (Open Food Facts) para produtos prontos e **Tabela TACO** para calcular receitas caseiras pelos ingredientes.

## 4b. Tabela TACO e código de barras ✅ (30/09/2026)
Busca na TACO (593 alimentos, offline) na aba Comida: adicionar ao dia em gramas ou salvar em Meus alimentos. Código de barras em Meus alimentos (Open Food Facts), que só preenche o formulário. Teste: `tests/taco.test.js`. Ideias: ler o código pela câmera (exigiria biblioteca), busca por nome de produtos (exigiria servidor intermediário).

## 5. Lembretes ✅ (30/09/2026)
Passo a passo dentro do app (Perfil > Lembretes no iPhone), com os horários do cardápio e a água dividida em 7 avisos. **Atenção:** links do site abertos por Atalhos vão para o Safari, que no iPhone guarda dados separados do app instalado; por isso os avisos só lembram, e o app é aberto pelo ícone.

## 6. Dados em um lugar só
Hoje: artefato do Claude e site da Vercel guardam separado. Opções: (a) usar só um; (b) sincronizar por backup/restauração com arquivo; (c) banco simples (Vercel KV/Blob ou Supabase) com login. (c) é grande e muda a privacidade: fazer só se pedir.

## 7. Backup mais fácil ✅ (30/09/2026)
Perfil: "Salvar arquivo", "Copiar backup" e restaurar de arquivo ou texto. Aba Hoje: lembrete com 30 dias sem backup ("Lembrar em 7 dias"). Teste: `tests/perfil.test.js`.

## 8. Relógio
`watch/` ainda não tem o flag das quartas e nunca foi testado em relógio real. Testar no simulador da AIoT-IDE. Apps Vela JS não leem frequência cardíaca, sono ou calorias.

## 9. Testes no navegador de verdade
Os testes atuais usam JSDOM. Acrescentar Playwright com capturas de tela (claro e escuro, iPhone 390×844) para pegar problemas de layout.

## 10. Melhorias de tela
- Reordenar refeições em dia de flag (jantar leve antes e completo depois) como opção, não só como dica.
- Ajuste de carga por exercício (passo de 1 kg ou 5 kg), para exercícios que não usam 2,5 kg.
- Mais exercícios com duas cargas (`PAIRS`), se necessário.
- Exportar histórico em CSV.
- ~~Acessibilidade: `aria-live` no `<main>`~~ ✅ removido; ao trocar de aba o foco vai para o título.
- ~~Limites nos campos do Perfil~~ ✅ (mesmas faixas da configuração inicial).

## Já feito (para não repetir)
Configuração inicial sem dados pessoais no código · `npm run data` no Windows (`scripts/py.mjs`) · Cardápio em medidas caseiras · água com quantidade exata · bi-set com duas cargas · Meus alimentos · flag opcional · resumo da semana · cronômetro e resumo do treino · links por hash (`#treino`).
