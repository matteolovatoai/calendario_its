from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from .models import Modulo, Lezione, Docente, Classe, Modulo_classe, Modulo_docente
from .database import get_session
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurazione CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permette GET, POST, PATCH, DELETE, ecc.
    allow_headers=["*"],
)

@app.get("/lezioni/")
def get_lezione(session: Session = Depends(get_session), inizio: datetime | None = None, fine: datetime | None = None, classe_id: int | None = None):
    statement = select(Lezione, Modulo.nome, Docente.cognome).select_from(Lezione).join(Modulo_docente).join(Docente).join(Modulo_classe).join(Modulo)
    if inizio:
        statement = statement.where(Lezione.inizio >= inizio)
    if fine:
        statement = statement.where(Lezione.fine <= fine)
    if classe_id:
        statement = statement.join(Modulo_classe).where(Modulo_classe.classe_id == classe_id)
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
def insert_lezione(lezione: Lezione, session: Session = Depends(get_session)):
    # Controllo se esiste il modulo
    modulo_docente = session.get(Modulo_docente, Lezione.modulo_docente_id)
    if not modulo_docente:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    
    if modulo_docente.id and modulo_docente.modulo_classe_id:
        conflitto = session.exec(select(Lezione).join(Modulo_docente).join(Modulo_classe).where(
            # sovrapposizione di orari
            Lezione.inizio < lezione.fine,
            Lezione.fine > lezione.inizio,
            (
                # controllo la sovrapposizione per la classe oppure per docente (il docente non puo fare piu lezioni in contemporanea)
                (Modulo_classe.classe_id == modulo_docente.modulo_classe_id) | (Modulo_docente.docente_id == modulo_docente.docente_id)
            )
        )).first()

    if conflitto:
        raise HTTPException(status_code=400, detail="Conflitto, esiste già una lezione in questo slot orario per questa classe o docente")

    # Aggiungo la lezione
    session.add(lezione)
    session.commit()
    session.refresh(lezione)
    return lezione

@app.patch("/lezioni/{id}", response_model=Lezione)
def update_lezione(lezione_id: int, dati_aggiornati: dict, session: Session = Depends(get_session)):
    lezione = session.get(Lezione, lezione_id)
    if not lezione:
        raise HTTPException(status_code=404, detail="Lezione non trovata")
    for chiave, valore in dati_aggiornati.items():
        #lezione.chiave = valore
        setattr(lezione, chiave, valore)
    session.add(lezione)
    session.commit()
    session.refresh(lezione)
    return lezione

@app.delete("/lezioni/{id}")
def delete_lezione(lezione_id: int, session: Session = Depends(get_session)):
    lezione = session.get(Lezione, lezione_id)
    if not lezione:
        raise HTTPException(status_code=404, detail="Lezione non trovata")
    session.delete(lezione)
    session.commit()
    return {"ok": True, "message": f"Lezione {lezione_id} eliminata"}

@app.get("/classi/")
def get_classi(session: Session = Depends(get_session)):
    classi = session.exec(select(Classe)).all()
    return classi