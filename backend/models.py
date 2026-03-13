from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

# Materia specifica (es. Introduzione alla programmazione)
class Materia(SQLModel, table=True):
    __tablename__: str = "materie"
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(unique=True)

    moduli: list["Modulo"] = Relationship(back_populates="materia")

class Docente(SQLModel, table=True):
    __tablename__: str = "docenti"
    id: int | None = Field(default=None, primary_key=True)
    nome: str
    cognome: str

    moduli: list["Modulo"] = Relationship(back_populates="docente")

# la classe (es. Lambda)
class Classe(SQLModel, table=True):
    __tablename__: str = "classi"
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(unique=True)
    # corso di studi (es AI & Data analisi)
    corso: str
    # sede del corso (es. Valdagno)
    sede: str

    moduli: list["Modulo"] = Relationship(back_populates="classe")

# un modulo è l'unione Docente, Materia, Classe
class Modulo(SQLModel, table=True):
    '''
    Permette di creare un'associazione docente materia, un docente insegna una o più materie
    Cercare le materie insegnate in una specifica classe, un corso ha una lista di materie che verrano insegnate
    Collegare un docente ad una classe, ci sono molti docenti che insegnano Python, ma uno solo insegna ai Lambda

    Questo tipo di associazioni vengono fatte ad inizio anno 
    '''
    __tablename__: str = "moduli"
    id: int | None = Field(default=None, primary_key=True)

    materia_id: int = Field(foreign_key="materie.id")
    docente_id: int = Field(foreign_key="docenti.id")
    classe_id: int = Field(foreign_key="classi.id")

    materia: Materia = Relationship(back_populates="moduli")
    docente: Docente = Relationship(back_populates="moduli")
    classe: Classe = Relationship(back_populates="moduli")
    
class Lezione(SQLModel, table=True):
    __tablename__: str = "lezioni"
    id: int | None = Field(default=None, primary_key=True)
    inizio: datetime
    fine: datetime
    # l'aula dipende dalla sede del corso, per semplicità uso una stringa per i primi casi di test
    aula: str | None = Field(default=None)

