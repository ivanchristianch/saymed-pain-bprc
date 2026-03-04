from sqlalchemy import text
from app.db import SessionLocal

def upgrade():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR(16);"))
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status VARCHAR(64);"))
        db.commit()
        print("Successfully added columns to patients table.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    upgrade()
