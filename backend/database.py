from dotenv import load_dotenv
import os
from sqlmodel import create_engine, Session, SQLModel

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL non trovata nel file .env")

engine = create_engine(DATABASE_URL, echo=True) # echo true mostra a console i comandi SQL

def db_init():
    # Creazione tabelle sul db
    # Immporto perchè SQLModel deve capire a quali classi faccio riferimento
    from .models import Materia, Docente, Classe, Modulo, Lezione
    SQLModel.metadata.create_all(engine)

def get_session():
    # mantengo la sessione aperta finchè serve, poi la chiudo
    with Session(engine) as session:
        yield session