# Base de alimentos: nome -> (kcal, P, C, G, medida caseira)  por 100 g (ou 100 ml)
FOODS = [
("Arroz branco cozido",128,2.5,28.1,0.2,"1 escumadeira ≈ 100 g"),
("Feijão carioca cozido",76,4.8,13.6,0.5,"1 concha ≈ 100 g"),
("Macarrão cozido",102,3.4,19.9,0.5,"1 pegador ≈ 110 g"),
("Batata-doce cozida",77,0.6,18.4,0.1,"1 média ≈ 150–200 g"),
("Batata inglesa cozida",52,1.2,11.9,0.0,"1 média ≈ 130 g"),
("Mandioca (aipim) cozida",125,0.6,30.1,0.3,"1 pedaço médio ≈ 80 g"),
("Pão francês",300,8.0,58.6,3.1,"1 unidade ≈ 50 g"),
("Pão de forma integral",253,9.4,49.9,3.7,"1 fatia ≈ 25 g"),
("Aveia em flocos",394,13.9,66.6,8.5,"1 colher de sopa ≈ 15 g"),
("Peito de frango grelhado",159,32.0,0.0,2.5,"1 filé médio ≈ 120 g"),
("Carne moída (patinho) refogada",219,35.9,0.0,7.3,"1 colher de servir ≈ 50 g"),
("Tilápia grelhada",128,26.0,0.0,2.7,"1 filé médio ≈ 130 g"),
("Atum em conserva (natural)",116,25.5,0.0,0.8,"1 lata drenada ≈ 120 g"),
("Ovo cozido",146,13.3,0.6,9.5,"1 ovo ≈ 50 g"),
("Leite integral (ml)",61,3.2,4.6,3.3,"1 copo ≈ 200 ml"),
("Iogurte natural integral",51,4.1,1.9,3.0,"1 pote ≈ 170 g"),
("Queijo minas frescal",264,17.4,3.2,20.2,"1 fatia ≈ 30 g"),
("Whey protein (típico)",400,80.0,8.0,6.0,"1 scoop ≈ 30 g (confira seu rótulo)"),
("Banana prata",98,1.3,26.0,0.1,"1 unidade ≈ 80–100 g (sem casca)"),
("Maçã",56,0.3,15.2,0.4,"1 média ≈ 130 g"),
("Laranja pêra",37,1.0,8.9,0.1,"1 média ≈ 150 g"),
("Mel",309,0.4,84.0,0.0,"1 colher de sopa ≈ 20 g"),
("Pasta de amendoim",590,25.0,20.0,50.0,"1 colher de sopa ≈ 15 g (confira o rótulo)"),
("Azeite de oliva",884,0.0,0.0,100.0,"1 colher de sopa ≈ 12 g"),
("Castanha-do-pará",643,14.5,15.1,63.5,"1 unidade ≈ 4 g"),
("Brócolis cozido",25,2.1,4.4,0.5,"1 pegador ≈ 60 g"),
("Salada crua (alface, tomate, cenoura)",20,1.0,4.0,0.2,"1 prato de sobremesa ≈ 80 g"),
("Isotônico (ml)",24,0.0,6.0,0.0,"garrafa ≈ 500 ml"),
("Água de coco (ml)",22,0.0,5.3,0.0,"1 copo ≈ 200 ml"),
]
D = {f[0]:f[1:5] for f in FOODS}

def tot(meals):
    T=[0,0,0,0]
    for m in meals:
        for (n,q) in m[2]:
            k,p,c,g = D[n]
            T[0]+=k*q/100;T[1]+=p*q/100;T[2]+=c*q/100;T[3]+=g*q/100
    return [round(x) for x in T]

TREINO = [
("Café da manhã","07:30",[("Pão de forma integral",50),("Ovo cozido",150),("Leite integral (ml)",200),("Banana prata",100),("Aveia em flocos",30)]),
("Lanche da manhã","10:00",[("Iogurte natural integral",85),("Whey protein (típico)",15),("Maçã",130),("Mel",20)]),
("Almoço","12:30",[("Arroz branco cozido",250),("Feijão carioca cozido",50),("Peito de frango grelhado",180),("Salada crua (alface, tomate, cenoura)",80),("Azeite de oliva",6)]),
("Pré-treino (1h30 antes)","15:00",[("Pão francês",50),("Atum em conserva (natural)",60),("Banana prata",150)]),
("Pós-treino / jantar","19:15",[("Macarrão cozido",220),("Carne moída (patinho) refogada",100),("Brócolis cozido",60),("Azeite de oliva",12)]),
("Ceia","22:00",[("Iogurte natural integral",170),("Castanha-do-pará",16)]),
]
SABADO = [
("Café da manhã","07:30",[("Pão francês",50),("Ovo cozido",150),("Leite integral (ml)",100),("Banana prata",100)]),
("Pré-treino principal (2h30 antes)","09:30",[("Arroz branco cozido",200),("Peito de frango grelhado",180),("Batata-doce cozida",150),("Brócolis cozido",60),("Azeite de oliva",6)]),
("Lanche leve (30–45 min antes)","11:15",[("Banana prata",100),("Mel",10),("Isotônico (ml)",250)]),
("Durante o treino (12h–16h)","12:00–16:00",[("Isotônico (ml)",500),("Água de coco (ml)",400),("Banana prata",100)]),
("Pós-treino (até 1h após)","16:30",[("Arroz branco cozido",250),("Feijão carioca cozido",50),("Carne moída (patinho) refogada",100),("Salada crua (alface, tomate, cenoura)",80),("Azeite de oliva",12),("Laranja pêra",150)]),
("Jantar","19:45",[("Macarrão cozido",110),("Tilápia grelhada",130),("Brócolis cozido",60),("Azeite de oliva",6)]),
("Ceia","22:00",[("Iogurte natural integral",170),("Aveia em flocos",30),("Castanha-do-pará",12)]),
]
DESCANSO = [
("Café da manhã","08:30",[("Pão francês",50),("Ovo cozido",150),("Queijo minas frescal",30),("Leite integral (ml)",100),("Laranja pêra",150)]),
("Lanche da manhã","11:00",[("Iogurte natural integral",170),("Whey protein (típico)",30),("Aveia em flocos",30)]),
("Almoço","13:30",[("Arroz branco cozido",200),("Feijão carioca cozido",100),("Peito de frango grelhado",120),("Salada crua (alface, tomate, cenoura)",80),("Azeite de oliva",12)]),
("Lanche da tarde","16:30",[("Pão de forma integral",50),("Atum em conserva (natural)",60),("Banana prata",100)]),
("Jantar","20:00",[("Batata-doce cozida",225),("Carne moída (patinho) refogada",100),("Brócolis cozido",120),("Azeite de oliva",6)]),
("Ceia","22:30",[("Iogurte natural integral",170),("Castanha-do-pará",12)]),
]
if __name__=="__main__":
    for n,m in [("TREINO",TREINO),("SABADO",SABADO),("DESCANSO",DESCANSO)]:
        print(n,tot(m))
