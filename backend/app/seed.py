from sqlalchemy.orm import Session
from .models import User, Role
from .security import hash_password

DEFAULT_USERS = [
    ("admin@bprc.id", "Admin123!", "Admin SayMed", Role.admin),
    ("doctor@bprc.id", "Doctor123!", "Dr. BPRC", Role.doctor),
    ("nurse@bprc.id", "Nurse123!", "Nurse BPRC", Role.nurse),
]

def seed_users(db: Session):
    for email, pw, name, role in DEFAULT_USERS:
        exists = db.query(User).filter(User.email == email).first()
        if exists:
            continue
        db.add(User(email=email, password_hash=hash_password(pw), full_name=name, role=role))
    db.commit()
