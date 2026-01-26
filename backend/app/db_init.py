"""Initialize DB tables + seed users.

Run on container start.
"""
from sqlalchemy.orm import Session
from .db import engine, SessionLocal
from .models import Base
from .seed import seed_users

def main():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
