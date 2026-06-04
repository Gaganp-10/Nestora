from datetime import datetime
from app.extensions import db
from sqlalchemy import CheckConstraint


class Review(db.Model):
    """Public review left on a hostel."""

    __tablename__ = "reviews"

    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hostel_id = db.Column(
        db.Integer,
        db.ForeignKey("hostels.hostel_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range_check"),
    )

    # Relationships
    hostel = db.relationship("Hostel", back_populates="reviews")

    def to_dict(self):
        return {
            "review_id": self.review_id,
            "hostel_id": self.hostel_id,
            "reviewer_name": self.reviewer_name,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Review {self.review_id} hostel={self.hostel_id} rating={self.rating}>"
