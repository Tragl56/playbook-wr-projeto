# Playbook WR para o Redmi Watch (Xiaomi Vela JS)

App leve para o pulso, gerado a partir da planilha e do app do celular.

## O que ele faz
- **Tela inicial:** dia da semana, treino de hoje e quantos itens você já fez.
- **Treino:** lista do dia (Academia A/B/C, campo, aquecimento do sábado ou descanso ativo). Toque em um item para marcar como feito (o relógio vibra).
- **Descanso:** cronômetro com atalhos de 0:45, 1:00, 1:30, 2:00 e 3:00, botão +15 s e vibração ao terminar.
- **Água:** contador em passos de 250 ml, com meta de 3,4 L.

Tudo fica salvo no próprio relógio (por dia). Não há sincronização com o app do celular.

## Como instalar

1. Baixe a **AIoT-IDE** (IDE oficial da Xiaomi para apps Vela JS, baseada no VS Code) na documentação: https://iot.mi.com/vela/quickapp/en/tools/
   Requisitos: macOS 14+, Windows 10+ ou Ubuntu 20.04+.
2. Na IDE: **File > New Project > Watch**, escolha um template e crie o projeto.
3. Copie a pasta `src/` deste zip por cima da pasta `src/` do projeto criado.
   Se a IDE reclamar do `manifest.json` (por exemplo, `minAPILevel`), compare com o `manifest.json` gerado pelo template e ajuste esse campo.
4. Siga o guia lateral da IDE (instalar dependências com `npm i`, criar o simulador com "Auto Install").
5. Rode no **simulador** e confira as telas.
6. Clique em **Package** para gerar o arquivo `.debug.rpk` na pasta `dist/`.
7. Para levar ao relógio de verdade, use a **depuração em dispositivo real** da própria IDE.
   A documentação da Xiaomi que li não detalha esse passo para o Redmi Watch 6, então siga as instruções atuais da IDE para o seu aparelho.

## O que o app do relógio NÃO lê
Frequência cardíaca, sono e calorias **não** são acessíveis por apps Vela JS: a lista de interfaces da Xiaomi tem sensores de pressão, acelerômetro e bússola, mas nada de saúde. No Redmi Watch 6, nem o acelerômetro está disponível. Por isso esses dados entram no app do celular (aba Hoje), copiados do Mi Fitness ou Xiaomi Wear.

## Cuidados
- O **Redmi Watch 6** aparece nas tabelas de suporte da documentação oficial de Vela JS (por exemplo, na página do sensor, com bússola suportada), então é um aparelho reconhecido. Se a IDE não oferecer o seu modelo, atualize a IDE.
- O código foi conferido em simulação de lógica (sintaxe, telas e armazenamento), mas **não foi testado em um relógio real**. Pode ser preciso ajustar tamanhos de texto e botões à tela.
- O cronômetro usa o relógio do sistema e pode atrasar se o relógio apagar a tela ou pausar o app.

## Personalizar
Os treinos ficam em `src/common/plan.js`. Edite os nomes e as séries à vontade.
A meta de água está em `goalWater` (em ml) no mesmo arquivo.
