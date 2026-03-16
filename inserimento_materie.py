import pandas as pd
from backend.models import Materia
from sqlmodel import Session
from backend.database import engine

def import_materie():
    df_materie = pd.read_csv("calendario_lambda.xlsx - moduli_Lambda.csv")
    df_materie = df_materie.drop(range(0,2)).drop(range(24, 27))
    df_materie.columns = ["descrizione", "tot_ore", "drop_1", "drop_2", "drop_3", "drop_4", "drop_5", "drop_6", "drop_7"]
    df_materie = df_materie.drop(columns=["drop_1", "drop_2", "drop_3", "drop_4", "drop_5", "drop_6", "drop_7"]).reset_index(drop=True)

    
    with Session(engine) as session:
        for _, materia in df_materie.iterrows():
            nuova_materia = Materia(nome=materia["descrizione"])
            session.add(nuova_materia)
        session.commit()
    print("🟢 Inserimento materie completato")
if __name__ == "__main__":
    import_materie()