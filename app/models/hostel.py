from datetime import datetime
from app.extensions import db


class Hostel(db.Model):
    """Hostel / PG listing created by an owner."""

    __tablename__ = "hostels"

    hostel_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    hostel_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    city = db.Column(db.String(100), nullable=False)
    area = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    contact_phone = db.Column(db.String(15), nullable=True)
    gender = db.Column(
        db.Enum("male", "female", "co-ed", name="hostel_gender_enum"),
        nullable=False,
        default="co-ed",
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True,
    )

    # Relationships
    owner = db.relationship("User", back_populates="hostels")
    rooms = db.relationship(
        "Room", back_populates="hostel", cascade="all, delete-orphan", lazy="select"
    )
    images = db.relationship(
        "HostelImage",
        back_populates="hostel",
        cascade="all, delete-orphan",
        lazy="select",
    )
    reviews = db.relationship(
        "Review", back_populates="hostel", cascade="all, delete-orphan", lazy="dynamic"
    )

    # ------------------------------------------------------------------ #
    # Serialisation helpers
    # ------------------------------------------------------------------ #

    def to_dict(self):
        """Lightweight dict used in listing responses."""
        from app.models.image import HostelImage
        from app.models.review import Review
        from sqlalchemy import func

        primary_image = (
            HostelImage.query.filter_by(hostel_id=self.hostel_id, is_primary=True)
            .first()
        )
        avg = db.session.query(func.avg(Review.rating)).filter(
            Review.hostel_id == self.hostel_id
        ).scalar()

        rent_values = [r.rent for r in self.rooms]
        return {
            "hostel_id": self.hostel_id,
            "hostel_name": self.hostel_name,
            "description": self.description,
            "city": self.city,
            "area": self.area,
            "address": self.address,
            "contact_phone": self.contact_phone,
            "gender": self.gender,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "primary_image": (
                primary_image.image_url if primary_image else None
            ),
            "average_rating": round(float(avg), 1) if avg else None,
            "rent_range": {
                "min": float(min(rent_values)) if rent_values else None,
                "max": float(max(rent_values)) if rent_values else None,
            },
        }

    def to_detail_dict(self):
        """Full detail dict for GET /api/hostels/<id>."""
        from app.models.review import Review
        from sqlalchemy import func

        avg = db.session.query(func.avg(Review.rating)).filter(
            Review.hostel_id == self.hostel_id
        ).scalar()
        review_count = self.reviews.count()

        rent_values = [r.rent for r in self.rooms]

        return {
            "hostel_id": self.hostel_id,
            "hostel_name": self.hostel_name,
            "description": self.description,
            "city": self.city,
            "area": self.area,
            "address": self.address,
            "contact_phone": self.contact_phone,
            "gender": self.gender,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "owner": self.owner.public_dict() if self.owner else None,
            "rooms": [r.to_dict() for r in self.rooms],
            "images": [img.to_dict() for img in self.images],
            "reviews": {
                "count": review_count,
                "average_rating": round(float(avg), 1) if avg else None,
            },
            "rent_range": {
                "min": float(min(rent_values)) if rent_values else None,
                "max": float(max(rent_values)) if rent_values else None,
            },
        }

    def __repr__(self):
        return f"<Hostel {self.hostel_name}>"
