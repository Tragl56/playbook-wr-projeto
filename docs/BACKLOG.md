# Backlog

Ordem sugerida. Cada item tem um critério para saber quando está pronto.

## 1. Privacidade: tirar os dados pessoais do código ✅ (30/09/2026)
Perfil neutro no código + tela de configuração inicial (`vSetup`). A planilha lê o perfil de `spreadsheet/perfil.local.json`, que fica fora do Git. Teste: `tests/setup.test.js`.

## 2. Repositório + Vercel por Git
Repositório: `github.com/Tragl56/playbook-wr-projeto` (código enviado). Falta: importar o repositório na Vercel (veja `docs/DEPLOY.md`). **Pronto quando:** um `git push` publica o site e o CI fica verde.

## 3. Ajuste de metas pela tendência do peso
Com 2 a 3 semanas de pesagens (`S.weights`), calcule a variação por semana e mostre na aba Evolução um aviso: perdendo rápido demais (mais que ~1% do peso por semana), sem perder, ou dentro da faixa, com uma sugestão de ajuste de calorias. Nunca aplicar sozinho: só sugerir.
**Pronto quando:** existe teste com pesagens simuladas para cada um dos três casos.

## 4. Conferir valores de comida
Ceviche e café com proteína (`seedCustom` em `20-telas-...js`) são estimativas. Trocar pelos valores do rótulo/receita do dono. Revisar também as medidas caseiras em `data/units.py` se ele disser que uma concha, escumadeira ou colher é diferente.

## 5. Lembretes
O PWA no iPhone não recebe notificações sem servidor. Escrever um passo a passo de Atalhos (Shortcuts) com automações de horário para água e refeições, que abrem `.../#comida` e `.../#hoje` (os links por hash já funcionam).

## 6. Dados em um lugar só
Hoje: artefato do Claude e site da Vercel guardam separado. Opções: (a) usar só um; (b) sincronizar por backup/restauração com arquivo; (c) banco simples (Vercel KV/Blob ou Supabase) com login. (c) é grande e muda a privacidade: fazer só se pedir.

## 7. Backup mais fácil
Botão "Copiar backup" e "Baixar arquivo" em Perfil, e um lembrete mensal na aba Hoje.

## 8. Relógio
`watch/` ainda não tem o flag das quartas e nunca foi testado em relógio real. Testar no simulador da AIoT-IDE. Apps Vela JS não leem frequência cardíaca, sono ou calorias.

## 9. Testes no navegador de verdade
Os testes atuais usam JSDOM. Acrescentar Playwright com capturas de tela (claro e escuro, iPhone 390×844) para pegar problemas de layout.

## 10. Melhorias de tela
- Reordenar refeições em dia de flag (jantar leve antes e completo depois) como opção, não só como dica.
- Ajuste de carga por exercício (passo de 1 kg ou 5 kg), para exercícios que não usam 2,5 kg.
- Mais exercícios com duas cargas (`PAIRS`), se necessário.
- Exportar histórico em CSV.
- Acessibilidade: `aria-live` no `<main>` anuncia a tela inteira a cada mudança; trocar por um aviso só nos toasts.

## Já feito (para não repetir)
Configuração inicial sem dados pessoais no código · Cardápio em medidas caseiras · água com quantidade exata · bi-set com duas cargas · Meus alimentos · flag opcional · resumo da semana · cronômetro e resumo do treino · links por hash (`#treino`).
