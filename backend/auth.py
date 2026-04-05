import json

from fastapi import Depends, status, HTTPException
from models import Utente, RuoloAccesso
from database import get_session, Session
from fastapi.security import OAuth2PasswordBearer
from uuid import UUID
from jose import jwt
import os
from dotenv import load_dotenv
from sqlmodel import select

load_dotenv()

SUPABASE_JWK_PUBLIC = os.getenv("SUPABASE_JWK_PUBLIC")

# Questo dice a FastAPI di cercare il token nell'header "Authorization: Bearer <TOKEN>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> Utente:
    if not SUPABASE_JWK_PUBLIC:
        raise ValueError("ERRORE: SUPABASE_JWK non trovata nel file .env")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossibile validare le credenziali",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        public_key=json.loads(SUPABASE_JWK_PUBLIC)
        payload = jwt.decode(
            token, 
            key=public_key, 
            algorithms=["ES256"], 
            options={"verify_signature": True, "verify_aud": True},
            audience="authenticated"
        )
        user_raw = payload.get("sub") # sub è dove supabase mette lo user_id
        if not user_raw:
            raise credentials_exception
        user_id: str = str(user_raw)
        if not user_id:
            raise credentials_exception
    except Exception as e:
        print(f"Errore JWT: {e}")
        raise credentials_exception
    
    statement = select(Utente).where(Utente.id == UUID(user_id))
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato nel database")

    return user

def get_user_segreteria(user: Utente = Depends(get_current_user)) -> Utente:
    if user.ruolo != RuoloAccesso.segreteria:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Questa è un'area riservata")
    return user