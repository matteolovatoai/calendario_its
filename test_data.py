from sqlmodel import Session
from backend.database import engine
from backend.models import Classe

def inserisci_classe():
    with Session(engine) as session:
        nuova_classe = Classe(nome="LAMBDA", corso="Artificial Intelligence & Data Analysis", sede="Valdagno")
        print("Creato la classe!")
        session.add(nuova_classe)
        print("Aggiunta alla sessione")
        session.commit()
        print("🟢 Inserimento completato")

if __name__ == "__main__":
    inserisci_classe()