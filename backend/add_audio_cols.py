from sqlalchemy import create_engine, text
from app.config import settings

# Adjust connection string if needed. Assuming settings.database_url is correct.
engine = create_engine(settings.database_url)

def run_migration():
    print("Running migration to add audio columns...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE encounters ADD COLUMN audio_nurse VARCHAR(255);"))
            print("Added audio_nurse column.")
        except Exception as e:
            print(f"Skipping audio_nurse (might exist): {e}")

        try:
            conn.execute(text("ALTER TABLE encounters ADD COLUMN audio_doctor VARCHAR(255);"))
            print("Added audio_doctor column.")
        except Exception as e:
            print(f"Skipping audio_doctor (might exist): {e}")
            
        conn.commit()
    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
