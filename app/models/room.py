from app.extensions import db


class Room(db.Model):
    """Room type within a hostel."""

    __tablename__ = "rooms"

    room_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hostel_id = db.Column(
        db.Integer,
        db.ForeignKey("hostels.hostel_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    room_type = db.Column(
        db.Enum("single", "double", "triple", name="room_type_enum"),
        nullable=False,
    )
    rent = db.Column(db.Numeric(10, 2), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    available_beds = db.Column(db.Integer, nullable=False, default=0)

    # Relationships
    hostel = db.relationship("Hostel", back_populates="rooms")

    def to_dict(self):
        return {
            "room_id": self.room_id,
            "hostel_id": self.hostel_id,
            "room_type": self.room_type,
            "rent": float(self.rent),
            "capacity": self.capacity,
            "available_beds": self.available_beds,
        }

    def __repr__(self):
        return f"<Room {self.room_type} @ hostel {self.hostel_id}>"
