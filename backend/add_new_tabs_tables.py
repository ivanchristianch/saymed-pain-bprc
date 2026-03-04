import os
from sqlalchemy import create_engine
from app.db import Base
# Import all models to ensure they are registered with Base metadata before create_all
from app.models import User, Patient, Encounter, NursingAssessment, MedicalAssessment, PhysicalExam, File, AuditLog, Therapy, DischargeSummary, Correspondence

def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/saymed")
    engine = create_engine(db_url)
    
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    main()
