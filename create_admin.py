"""
create_admin.py — Run once to seed the admin user.
Usage:  python create_admin.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models.user import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    existing = User.query.filter_by(email="admin@nestora.com").first()
    if not existing:
        admin = User(
            name="Nestora Admin",
            email="admin@nestora.com",
            password_hash=generate_password_hash("Admin@1234"),
            role="admin",
            phone="9999999999",
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created successfully!")
        print("   Email:    admin@nestora.com")
        print("   Password: Admin@1234")
        print("   Role:     admin")
    else:
        print(f"ℹ️  Admin already exists: {existing.email} (role={existing.role})")
