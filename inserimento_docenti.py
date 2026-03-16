import pandas as pd
from sqlmodel import Session
from backend.models import Docente
from backend.database import engine

df_orario = pd.read_csv("calendario_lambda.xlsx - calendario_LAM.csv")
df_orario = df_orario.drop(range(0,5))
df_orario.columns = ["anno", "data", "sett", "ora_inzio", "ora_fine", 'tot_ore', 'docente', 'materia']
df_orario = df_orario.drop(columns=["anno", "sett", "tot_ore", "materia"]).dropna()

df_docenti = df_orario['docente'].unique()

with Session(engine) as session:
    for index, row in enumerate(df_docenti):
        # inserimento con segnaposto per non caricare dati sensibili in fase di test
        nuovo_docente = Docente(nome="Docente", cognome=f"Docente {index}")
        session.add(nuovo_docente)
    session.commit()
    print("🟢 Inserimento docenti avvenuto")