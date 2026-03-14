from sqlmodel import Session, select
from backend.models import Docente, Materia, Classe, Modulo
from backend.database import engine

def test_creazione_modulo():
    with Session(engine) as session:
        classe = session.exec(select(Classe).where(Classe.nome == "LAMBDA")).first()
        materia = Materia(nome="Materia A")
        docente = Docente(nome="Docente A", cognome="Cognome")
        session.add(materia)
        session.add(docente)

        session.commit()
        session.refresh(materia)
        session.refresh(docente)
        if materia.id and docente.id and classe and classe.id:
            nuovo_modulo = Modulo(materia_id=materia.id, docente_id=docente.id, classe_id=classe.id)
            session.add(nuovo_modulo)
            session.commit()
            print("🟢 Successo!")
        else:
            print("❌ Errore, qualche id non è stato generato correttamente")

if __name__ == "__main__":
    test_creazione_modulo()