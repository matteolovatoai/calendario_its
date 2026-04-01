from sqlalchemy import UniqueConstraint
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum
from uuid import UUID

# Modulo specifico (es. COD01 - Informatica)
class Modulo(SQLModel, table=True):
    __tablename__: str = "moduli"
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(unique=True)

    moduli_classe: list["Modulo_classe"] = Relationship(back_populates="modulo")

class Docente(SQLModel, table=True):
    __tablename__: str = "docenti"
    id: int | None = Field(default=None, primary_key=True)
    nome: str
    cognome: str

    moduli_docente: list["Modulo_docente"] = Relationship(back_populates="docente")


# la classe (es. Lambda)
class Classe(SQLModel, table=True):
    __tablename__: str = "classi"
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(unique=True)
    # corso di studi (es AI & Data analisi)
    corso: str
    # sede del corso (es. Valdagno)
    sede: str

    moduli_classe: list["Modulo_classe"] = Relationship(back_populates="classe")
    studenti: list["Utente"] = Relationship(back_populates="classe")

# questa suddivisione permette più docenti di insegnare lo stesso modulo alla stessa classe, matenendo un unico monteore
class Modulo_classe(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("modulo_id", "classe_id", name="unique_modulo_classe"),)
    id: int | None = Field(default=None, primary_key=True)

    modulo_id: int | None = Field(default=None, foreign_key="moduli.id", nullable=False)
    classe_id: int | None = Field(default=None, foreign_key="classi.id", nullable=False)
    # I moduli possono essere per classi diverse e in base all'indirizzo possono avere dei monteore diversi
    ore_totali: int = Field(default=0, description="Monte ore totale previsto per questo modulo")

    modulo: Modulo = Relationship(back_populates="moduli_classe")
    classe: Classe = Relationship(back_populates="moduli_classe")
    moduli_docente: list["Modulo_docente"] = Relationship(back_populates="modulo_classe")

# abilitazione al docente ad insegnare il modulo_classe
class Modulo_docente(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("modulo_classe_id", "docente_id", name="unique_modulo_docente"),)
    id: int | None = Field(default=None, primary_key=True)

    modulo_classe_id: int | None = Field(default=None, foreign_key="modulo_classe.id", nullable=False)
    docente_id: int | None = Field(default=None, foreign_key="docenti.id", nullable=False)

    modulo_classe: Modulo_classe = Relationship(back_populates="moduli_docente")
    docente: Docente = Relationship(back_populates="moduli_docente")
    lezioni: list["Lezione"] = Relationship(back_populates="modulo_docente")


class Lezione(SQLModel, table=True):
    __tablename__: str = "lezioni"
    id: int | None = Field(default=None, primary_key=True)
    inizio: datetime = Field(index=True)
    fine: datetime = Field(index=True)
    modulo_docente_id: int | None = Field(default=None, foreign_key="modulo_docente.id", nullable=False)
    # l'aula dipende dalla sede del corso, per semplicità uso una stringa per i primi casi di test
    aula: str | None = Field(default=None)

    modulo_docente: Modulo_docente = Relationship(back_populates="lezioni")

class RuoloAccesso(str, Enum):
    segreteria = "segreteria"
    studente = "studente"

class Utente(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    nome: str
    cognome: str

    ruolo: RuoloAccesso = Field(default=RuoloAccesso.studente, nullable=False)

    classe_id: int | None = Field(default=None, foreign_key="classi.id")

    classe: Classe = Relationship(back_populates="studenti")