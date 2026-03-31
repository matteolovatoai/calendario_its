from fastapi import Depends, status, HTTPException
from backend.models import Utente
from backend.database import get_session, Session
from fastapi.security import OAuth2PasswordBearer
from uuid import UUID
import jwt
import os
from dotenv import load_dotenv
from sqlmodel import select

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Questo dice a FastAPI di cercare il token nell'header "Authorization: Bearer <TOKEN>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> Utente:
    if not SUPABASE_JWT_SECRET:
        raise ValueError("ERRORE: SUPABASE_JWT_SECRET non trovata nel file .env")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossibile validare le credenziali",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, ALGORITHM, audience="authenticated")
        user_raw = payload.get("sub") # sub è dove supabase mette lo user_id
        if not user_raw:
            raise credentials_exception
        user_id: str = str(user_raw)
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    statement = select(Utente).where(Utente.id == UUID(user_id))
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato nel database")

    return user
