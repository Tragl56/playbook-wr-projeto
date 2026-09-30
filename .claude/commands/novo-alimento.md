Adicione à base do app o alimento descrito em: $ARGUMENTS

Passos:
1. Em `data/foods.py`, inclua o alimento na lista `FOODS` com valores por 100 g (ou 100 ml): nome, kcal, proteína, carboidrato, gordura e a medida caseira em texto.
2. Em `data/units.py`, inclua a entrada de medida caseira com o MESMO nome: (unidade no singular, plural, gramas por unidade, passo, "o nome da unidade já é o alimento?", rótulo curto).
3. Rode `npm run data:app`, depois `npm run build` e `npm test`.
4. Se os valores vieram de estimativa sua e não de tabela ou rótulo, diga isso claramente no resumo.
