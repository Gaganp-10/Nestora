from datetime import datetime
from app.extensions import db


class User(db.Model):
    """User account — hostel owners and admins."""

    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum("owner", "admin", name="user_role_enum"),
        nullable=False,
        default="owner",
    )
    phone = db.Column(db.String(15), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    hostels = db.relationship(
        "Hostel", back_populates="owner", cascade="all, delete-orphan", lazy="dynamic"
    )

    def to_dict(self, include_sensitive=False):
        data = {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_sensitive:
            data["password_hash"] = self.password_hash
        return data

    def public_dict(self):
        """Minimal public representation (used inside hostel detail)."""
        return {
            "user_id": self.user_id,
            "name": self.name,
            "phone": self.phone,
        }

    def __repr__(self):
        return f"<User {self.email}>"
