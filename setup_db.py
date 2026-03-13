from backend.database import db_init

if __name__ == "__main__":
    print("⚙️ Tentativo di creazione del db.")
    try:
        db_init()
        print("🟢 Successo! Creazione tabelle avvenuta")
    except Exception as e:
        print(f"❌ Errore {e}")
