# Publicação

## Recomendado: GitHub + Vercel
1. Repositório: `https://github.com/Tragl56/playbook-wr-projeto` (branch `main`). Para enviar mudanças:
   ```bash
   git add -A && git commit -m "descreva a mudança"
   git push
   ```
2. Na Vercel, o projeto `playbook-wr` já está ligado a esse repositório (Settings > Git). O `vercel.json` define:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `dist/site`
3. A cada `git push` para `main`, a Vercel monta e publica. Pull requests geram links de teste.
4. No iPhone: abra o endereço no Safari > Compartilhar > **Adicionar à Tela de Início**. Depois de uma atualização, feche o app e abra de novo uma ou duas vezes.

O GitHub Actions (`.github/workflows/ci.yml`) roda build e testes em cada push.

## Foto do prato (função `api/foto.js`)
A Vercel publica `api/foto.js` como função junto com o site. Ela precisa de duas variáveis em **Settings > Environment Variables** (ambiente Production):
- `ANTHROPIC_API_KEY`: chave criada em console.anthropic.com (a conta precisa de créditos; é cobrança separada da assinatura do Claude).
- `APP_CODE`: um código de acesso que você inventa (6 caracteres ou mais). O mesmo código é digitado no app em Perfil > Foto do prato. Sem ele, qualquer pessoa com o link poderia gastar seus créditos.

Depois de salvar as variáveis, faça um **Redeploy** (Deployments > ⋯ > Redeploy) para a função passar a enxergá-las. Sem as variáveis, a função responde "ainda não foi configurada".

Custo aproximado com Claude Opus 5.5: US$ 0,04 a 0,07 por foto. Trocar `MODEL` em `api/foto.js` para `claude-sonnet-5-5` corta pela metade, com alguma perda de precisão.

## Conferir o que foi ao ar
`dist/hashes.txt` tem o sha1 de cada arquivo do site. Compare com os arquivos na Vercel se precisar ter certeza (Deployments > Source).

## Alternativa sem Git
`npx vercel --prod` dentro da pasta (precisa do CLI logado). Ele usa o `vercel.json`.

## App do Claude (artefato)
`dist/playbook-wr.html` é o app inteiro em um arquivo só. Dá para publicá-lo como artefato no Claude. Lá os dados ficam na conta (`claude.use('db')`); no site da Vercel ficam no aparelho (`localStorage`). **Os dois históricos são separados**: use o Backup em Perfil para levar de um para o outro, ou escolha um só para o dia a dia.

## Privacidade
O código não tem mais dados pessoais: o perfil é pedido na primeira abertura e fica só no aparelho (ou na conta, no artefato do Claude). O endereço da Vercel continua abrindo para quem tiver o link, mas cada pessoa vê só os próprios dados.
