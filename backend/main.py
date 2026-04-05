from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session, select
from models import Modulo, Lezione, Docente, Classe, Modulo_classe, Modulo_docente, RuoloAccesso, Utente
from database import get_session
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user, get_user_segreteria

app = FastAPI()

# Configurazione CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://calendario-its.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permette GET, POST, PATCH, DELETE, ecc.
    allow_headers=["*"],
)

@app.get("/lezioni/")
def get_lezione(session: Session = Depends(get_session), inizio: datetime | None = None, fine: datetime | None = None, classe_id: int | None = None, current_user: Utente = Depends(get_current_user)):
    statement = select(Lezione, Modulo.nome, Docente.cognome).select_from(Lezione).join(Modulo_docente).join(Docente).join(Modulo_classe).join(Modulo)
    if inizio:
        statement = statement.where(Lezione.inizio >= inizio)
    if fine:
        statement = statement.where(Lezione.fine <= fine)
    if current_user.ruolo == RuoloAccesso.studente:
        statement = statement.where(Modulo_classe.classe_id == current_user.classe_id)
    # se segreteria allora prende la classe dal menu a tendina
    if current_user.ruolo == RuoloAccesso.segreteria:
        statement = statement.where(Modulo_classe.classe_id == classe_id)
    results = session.exec(statement).all()

    output = []

    for lezione, materia_nome, docente_cognome in results:
        output.append({
            "id": lezione.id,
            "inizio": lezione.inizio,
            "fine": lezione.fine,
            "materia": materia_nome,
            "docente_cognome": docente_cognome,
            "modulo_docente_id": lezione.modulo_docente_id,
            "aula": lezione.aula
            })

    return output

@app.post("/lezioni/", status_code=status.HTTP_201_CREATED)
def insert_lezione(lezione: Lezione, session: Session = Depends(get_session), current_user: Utente = Depends(get_user_segreteria)):
    # Controllo se esiste il modulo
    modulo_docente = session.get(Modulo_docente, lezione.modulo_docente_id)
    if not modulo_docente:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    
    if modulo_docente.id and modulo_docente.modulo_classe_id:
        conflitto = session.exec(select(Lezione).join(Modulo_docente).join(Modulo_classe).where(
            # sovrapposizione di orari
            Lezione.inizio < lezione.fine,
            Lezione.fine > lezione.inizio,
            (
                # controllo la sovrapposizione per la classe oppure per docente (il docente non puo fare piu lezioni in contemporanea)
                (Modulo_classe.classe_id == modulo_docente.modulo_classe.classe_id) | (Modulo_docente.docente_id == modulo_docente.docente_id)
            )
        )).first()

    if conflitto:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conflitto, esiste già una lezione in questo slot orario per questa classe o docente")

    # Aggiungo la lezione
    session.add(lezione)
    session.commit()
    session.refresh(lezione)
    return lezione

@app.patch("/lezioni/{lezione_id}", response_model=Lezione)
def update_lezione(lezione_id: int, dati_aggiornati: dict, session: Session = Depends(get_session), current_user: Utente = Depends(get_user_segreteria)):
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

@app.delete("/lezioni/{lezione_id}")
def delete_lezione(lezione_id: int, session: Session = Depends(get_session), current_user: Utente = Depends(get_user_segreteria)):
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

@app.get("/utenti/me", response_model=Utente)
def get_user_profile(user: Utente = Depends(get_current_user)):
    # ritorna le info dell'utente cosi il front end sa il ruolo dell'utente
    return user

@app.get("/opzioni-moduli-docenti/")
def get_opzioni_moduli(classe_id: int | None = None, session: Session = Depends(get_session), user: Utente = Depends(get_user_segreteria)):
    statement = select(Modulo_docente.id, Docente.cognome, Modulo.nome).select_from(Modulo_docente).join(Docente).join(Modulo_classe).join(Modulo)
    if classe_id:
        statement.where(Modulo_classe.classe_id == classe_id)
    results = session.exec(statement).all()
    options = []
    for modulo_docente, docente, modulo in results:
        options.append({
            "id": modulo_docente,
            "label": f"{docente} - {modulo}"
            })
    return options