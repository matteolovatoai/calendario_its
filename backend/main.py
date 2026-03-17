from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from .models import Materia, Modulo, Lezione, Docente
from .database import engine, get_session

app = FastAPI()

@app.get("/lezioni/")
def get_lezioni(session: Session = Depends(get_session), inizio: datetime | None = None, fine: datetime | None = None):
    statement = select(Lezione, Materia.nome, Docente.cognome).select_from(Lezione).join(Modulo).join(Docente).join(Materia)
    if inizio:
        statement = statement.where(Lezione.inizio >= inizio)
    if fine:
        statement = statement.where(Lezione.fine <= fine)
    results = session.exec(statement).all()

    output = []

    for lezione, materia_nome, docente_cognome in results:
        output.append({
            "id": lezione.id,
            "inizio": lezione.inizio,
            "fine": lezione.fine,
            "materia": materia_nome,
            "docente_cognome": docente_cognome
            })

    return output

@app.post("/lezioni/", status_code=201)
def insert_lezioni(lezione: Lezione, session: Session = Depends(get_session)):
    # Controllo se esiste il modulo
    modulo = session.get(Modulo, Lezione.modulo_id)
    if not modulo:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    # Aggiungo la lezione
    session.add(lezione)
    session.commit()
    session.refresh(lezione)
    return lezione