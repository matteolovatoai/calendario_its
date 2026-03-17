from sqlmodel import Session, select
from backend.models import Materia, Docente, Classe, Lezione, Modulo
from backend.database import engine
import pandas as pd

df_orario = pd.read_csv("calendario_lambda.xlsx - calendario_LAM.csv")
df_orario = df_orario.drop(range(0,5))
df_orario.columns = ["anno", "data", "sett", "ora_inizio", "ora_fine", 'tot_ore', 'docente', 'materia']
df_docenti = df_orario['docente'].dropna().unique()
df_orario = df_orario.drop(columns=["anno", "sett", "tot_ore"]).dropna().replace("PW", "UFC 21 - Project Work 1")

df_orario['data'] = pd.to_datetime(df_orario["data"], dayfirst=True)
df_orario['ora_inizio'] = pd.to_timedelta(df_orario["ora_inizio"].str.replace('.',':'))
df_orario['ora_fine'] = pd.to_timedelta(df_orario["ora_fine"].str.replace('.',':'))
df_orario['data_inizio'] = df_orario["data"] + df_orario["ora_inizio"]
df_orario["data_fine"] = df_orario["data"] + df_orario["ora_fine"]
df_orario = df_orario.drop(columns=['data', 'ora_inizio', 'ora_fine'])

dict_docenti = {}

for index, docente in enumerate(df_docenti):
    if docente not in dict_docenti.keys():
        dict_docenti[docente] = f"Docente {index}"
df_orario['docente'] = df_orario['docente'].map(dict_docenti)

with Session(engine) as session:
    classe = session.exec(select(Classe).where(Classe.nome=="LAMBDA")).first()
    if classe and classe.id:
        df_moduli = pd.DataFrame(session.exec(select(Modulo, Docente.cognome, Materia.nome).join(Docente).join(Materia).where(Modulo.classe_id == classe.id)).all())
        lezioni_da_aggiungere = []
        for _, row in df_orario.iterrows():
            modulo_id = df_moduli[(df_moduli['cognome'] == row['docente']) & (df_moduli['nome'] == row['materia'])]['Modulo'].item().id
            nuova_lezione = Lezione(inizio=row["data_inizio"], fine=row["data_fine"], modulo_id=modulo_id)
            lezioni_da_aggiungere.append(nuova_lezione)
        session.add_all(lezioni_da_aggiungere)
        session.commit()