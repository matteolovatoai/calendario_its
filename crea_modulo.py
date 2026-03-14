from sqlmodel import Session, select
from backend.models import Docente, Materia, Classe, Modulo
from backend.database import engine

def test_creazione_modulo():
    with Session(engine) as session:
        classe = session.exec(select(Classe).where(Classe.nome == "LAMBDA")).first()
        docente = session.exec(select(Docente).where(Docente.nome == "Docente A")).first()
        materia = session.exec(select(Materia).where(Materia.nome == "Materia A")).first()
        session.refresh(docente)
        if materia and materia.id and docente and docente.id and classe and classe.id:
            nuovo_modulo = Modulo(materia_id=materia.id, docente_id=docente.id, classe_id=classe.id, ore_totali=5)
            session.add(nuovo_modulo)
            session.commit()
            print("🟢 Successo!")
        else:
            print("❌ Errore, qualche id non è stato generato correttamente")

if __name__ == "__main__":
    test_creazione_modulo()