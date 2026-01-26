import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    logger.info("Starting database migration...")
    
    # Create engine
    engine = create_engine(settings.database_url)
    
    # Create session
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if column exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='medical_assessments' AND column_name='anamnesis';
        """)
        result = db.execute(check_query).fetchone()
        
        if not result:
            logger.info("Adding 'anamnesis' column to 'medical_assessments' table...")
            # Add column
            alter_query = text("ALTER TABLE medical_assessments ADD COLUMN anamnesis TEXT;")
            db.execute(alter_query)
            db.commit()
            logger.info("Migration successful: 'anamnesis' column added.")
        else:
            logger.info("Column 'anamnesis' already exists. No changes needed.")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
