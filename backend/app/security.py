from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return pwd_context.verify(pw, hashed)

def create_access_token(sub: str, role: str, full_name: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.access_token_minutes)
    payload = {"sub": sub, "role": role, "full_name": full_name, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)
