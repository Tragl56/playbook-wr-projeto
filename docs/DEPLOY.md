# Publicação

## Recomendado: GitHub + Vercel
1. Repositório: `https://github.com/Tragl56/playbook-wr-projeto` (branch `main`). Para enviar mudanças:
   ```bash
   git add -A && git commit -m "descreva a mudança"
   git push
   ```
2. Na Vercel: **Add New… > Project**, importe o repositório. O `vercel.json` já define:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: `dist/site`
3. A cada `git push` para `main`, a Vercel monta e publica. Pull requests geram links de teste.
4. No iPhone: abra o endereço no Safari > Compartilhar > **Adicionar à Tela de Início**. Depois de uma atualização, feche o app e abra de novo uma ou duas vezes.

O GitHub Actions (`.github/workflows/ci.yml`) roda build e testes em cada push.

## Conferir o que foi ao ar
`dist/hashes.txt` tem o sha1 de cada arquivo do site. Compare com os arquivos na Vercel se precisar ter certeza (Deployments > Source).

## Alternativa sem Git
`npx vercel --prod` dentro da pasta (precisa do CLI logado). Ele usa o `vercel.json`.

## App do Claude (artefato)
`dist/playbook-wr.html` é o app inteiro em um arquivo só. Dá para publicá-lo como artefato no Claude. Lá os dados ficam na conta (`claude.use('db')`); no site da Vercel ficam no aparelho (`localStorage`). **Os dois históricos são separados**: use o Backup em Perfil para levar de um para o outro, ou escolha um só para o dia a dia.

## Privacidade
O código não tem mais dados pessoais: o perfil é pedido na primeira abertura e fica só no aparelho (ou na conta, no artefato do Claude). O endereço da Vercel continua abrindo para quem tiver o link, mas cada pessoa vê só os próprios dados.
