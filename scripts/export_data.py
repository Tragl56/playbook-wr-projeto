#!/usr/bin/env python3
"""Junta os dados do app em data/app-data.json (lido pelo build do site).

Fontes:
  data/foods.py      alimentos (por 100 g) e os 3 cardápios (treino, sábado, descanso)
  data/units.py      medidas caseiras de cada alimento
  data/training.json exercícios, campo, sábado e aquecimento (gerado por spreadsheet/build_xlsx.py)
  data/taco.json     Tabela TACO (gerado por scripts/taco.py)
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "data"))
from foods import FOODS, TREINO, SABADO, DESCANSO  # noqa: E402
from units import UNITS  # noqa: E402

d = json.load(open(ROOT / "data" / "training.json", encoding="utf-8"))
taco = json.load(open(ROOT / "data" / "taco.json", encoding="utf-8"))
campo = {("T" if k.startswith("TERÇA") else "S"): rows for k, rows in d["campo"].items()}
gym = {"A": d["gym"]["Academia A"], "B": d["gym"]["Academia B"], "C": d["gym"]["Academia C"]}
D = {
    "units": {k: list(v) for k, v in UNITS.items()},
    "gym": gym,
    "campo": campo,
    "sat": d["sat"],
    "aq": d["aq"],
    "foods": [list(f) for f in FOODS],
    "plans": {"treino": TREINO, "sab": SABADO, "desc": DESCANSO},
    # TACO: [nome, grupo, kcal, proteína, carboidrato, gordura] por 100 g
    "taco": taco["foods"],
    "tacoCats": taco["cats"],
}
out = ROOT / "data" / "app-data.json"
json.dump(D, open(out, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
print("dados do app:", out)
