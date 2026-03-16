import pandas as pd
from sqlmodel import Session, select
from backend.models import Materia, Docente, Classe, Modulo
from backend.database import engine

df_orario = pd.read_csv("calendario_lambda.xlsx - calendario_LAM.csv")
df_orario = df_orario.drop(range(0,5))
df_orario.columns = ["anno", "data", "sett", "ora_inzio", "ora_fine", 'tot_ore', 'docente', 'materia']
df_docenti = df_orario['docente'].dropna().unique()
df_moduli = df_orario[["docente", "materia"]].drop_duplicates().dropna().replace("PW", "UFC 21 - Project Work 1")

df_materie = pd.read_csv("calendario_lambda.xlsx - moduli_Lambda.csv")
df_materie = df_materie.drop(range(0,2)).drop(range(24, 27))
df_materie.columns = ["descrizione", "tot_ore", "drop_1", "drop_2", "drop_3", "drop_4", "drop_5", "drop_6", "drop_7"]
df_materie = df_materie.drop(columns=["drop_1", "drop_2", "drop_3", "drop_4", "drop_5", "drop_6", "drop_7"]).reset_index(drop=True)

dict_docenti = {}

for index, docente in enumerate(df_docenti):
    if docente not in dict_docenti.keys():
        dict_docenti[docente] = index

with Session(engine) as session:
    for index, row in df_moduli.iterrows():
        tot_materia = df_materie[df_materie["descrizione"] == row["materia"]]["tot_ore"]
        if tot_materia.empty:
            tot_materia = 0
        else:
            tot_materia = int(tot_materia.item())
        docente = session.exec(select(Docente).where(Docente.cognome==f"Docente {dict_docenti[row["docente"]]}")).first()
        materia = session.exec(select(Materia).where(Materia.nome==row["materia"])).first()
        classe = session.exec(select(Classe).where(Classe.nome=="LAMBDA")).first()
        if not materia:
            materia = Materia(nome=row["materia"])
            session.add(materia)
            session.commit()
            session.refresh(materia)
        if classe and docente and classe.id and docente.id and materia.id:
            nuovo_modulo = Modulo(materia_id=materia.id, classe_id=classe.id, docente_id=docente.id, ore_totali=tot_materia)
            session.add(nuovo_modulo)
    session.commit()
    print("🟢 Caricato tutti i moduli")