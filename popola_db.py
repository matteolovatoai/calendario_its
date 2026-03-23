from sqlmodel import Session, select
import pandas as pd
from backend.database import engine
from backend.models import Classe, Docente, Lezione, Modulo, Modulo_classe, Modulo_docente

def popola_db():
    # --- excel dei moduli con le ore per modulo ---
    df_moduli_ore = pd.read_csv("calendario_lambda.xlsx - moduli_Lambda.csv").drop(range(0,2))
    df_moduli_ore.columns = ["materia", "totale_ore", "ore_inserite", "ore_anno_1", "ore_anno_1_inserite", "delta", "ore_anno_2", "note_anno_1", "note_anno_2"]
    df_moduli_ore = df_moduli_ore.drop(columns=["ore_inserite", "ore_anno_1", "ore_anno_1_inserite", "delta", "ore_anno_2", "note_anno_1", "note_anno_2"]).dropna().reset_index(drop=True)

    # --- excel delle lezioni ---
    df_orario = pd.read_csv("calendario_lambda.xlsx - calendario_LAM.csv")
    df_orario = df_orario.drop(range(0,5))
    df_orario.columns = ["anno", "data", "sett", "ora_inizio", "ora_fine", 'tot_ore', 'docente', 'materia']
    df_orario = df_orario.drop(columns=["anno", "sett", "tot_ore"]).dropna().replace("PW", "UFC 21 - Project Work 1")
    df_orario["data"] = pd.to_datetime(df_orario["data"], dayfirst=True)
    df_orario["ora_inizio"] = df_orario["data"] + pd.to_timedelta(df_orario["ora_inizio"].str.replace(".", ":"))
    df_orario["ora_fine"] = df_orario["data"] + pd.to_timedelta(df_orario["ora_fine"].str.replace(".", ":"))
    df_orario = df_orario.drop(columns=["data"])
    
    with Session(engine) as session:
        classe = session.exec(select(Classe).where(Classe.nome == "LAMBDA")).first()
        if not classe:
            classe = Classe(nome="LAMBDA", corso="Artificial Intelligence & Data Analysis", sede="Valdagno")
            session.add(classe)
            session.commit()
            session.refresh(classe)
        for row in df_orario.itertuples(index=False):
            data_ora_inizio_lezione = row[0]
            data_ora_fine_lezione = row[1]
            docente_nominativo = row[2]
            modulo_materia = row[3].strip()

            modulo = session.exec(select(Modulo).where(Modulo.nome == modulo_materia)).first()
            if not modulo:
                modulo = Modulo(nome=modulo_materia)
                session.add(modulo)
                session.commit()
                session.refresh(modulo)
            modulo_classe = session.exec(select(Modulo_classe).where(Modulo_classe.classe_id==classe.id, Modulo_classe.modulo_id==modulo.id)).first()
            if not modulo_classe:
                if modulo_materia == "GITA MORATO PANE" or modulo_materia == "GITA AMER" or modulo_materia == "ESAME" or modulo_materia == "ARTIFEX - Centro Culturale Altinate - San Gaetano, via Altinate, 71 - Padova" or modulo_materia == "speed date Stage":
                    totale_ore = 0
                else:
                    print("🟢", modulo_materia, df_moduli_ore.loc[df_moduli_ore["materia"] == modulo_materia]["totale_ore"].shape)
                    
                    totale_ore = df_moduli_ore.loc[df_moduli_ore["materia"] == modulo_materia]["totale_ore"].item()
                modulo_classe = Modulo_classe(modulo=modulo, classe=classe, ore_totali=totale_ore)
                session.add(modulo_classe)
                session.commit()
                session.refresh(modulo_classe)
            docente = session.exec(select(Docente).where(Docente.cognome == row[2])).first()
            if not docente:
                docente = Docente(nome="Docente", cognome=docente_nominativo)
                session.add(docente)
                session.commit()
                session.refresh(docente)
            modulo_docente = session.exec(select(Modulo_docente).join(Modulo_classe).where(Modulo_classe.classe_id==classe.id, Modulo_docente.docente_id==docente.id)).first()
            if not modulo_docente:
                modulo_docente = Modulo_docente(modulo_classe=modulo_classe, docente=docente)
                session.add(modulo_docente)
                session.commit()
                session.refresh(modulo_docente)
            lezione = session.exec(select(Lezione).where(Lezione.inizio == data_ora_inizio_lezione, Lezione.fine == data_ora_fine_lezione, Lezione.modulo_docente_id==modulo_docente.id)).first()
            if not lezione:
                lezione = Lezione(modulo_docente=modulo_docente, inizio=data_ora_inizio_lezione, fine=data_ora_fine_lezione)
                session.add(lezione)
                session.commit()

if __name__ == "__main__":
    popola_db()