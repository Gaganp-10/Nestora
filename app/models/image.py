import os
from datetime import datetime
from app.extensions import db


class HostelImage(db.Model):
    """Image associated with a hostel."""

    __tablename__ = 'hostel_images'

    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hostel_id = db.Column(
        db.Integer,
        db.ForeignKey('hostels.hostel_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    hostel = db.relationship('Hostel', back_populates='images')

    def to_dict(self):
        """
        Return a dict representation.

        In PRODUCTION the image_url column stores full Cloudinary https:// URLs,
        so we return it verbatim.

        In DEVELOPMENT the column stores a relative path like /uploads/<id>/<file>,
        so we prepend the local server URL.
        """
        env = os.environ.get('FLASK_ENV', 'development')

        if env == 'production' or self.image_url.startswith('http'):
            # Cloudinary in production — already a full URL
            image_url = self.image_url
        else:
            # Local development — prepend server base
            image_url = f'http://localhost:5000{self.image_url}'

        return {
            'image_id': self.image_id,
            'hostel_id': self.hostel_id,
            'image_url': image_url,
            'is_primary': self.is_primary,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }

    def __repr__(self):
        return f'<HostelImage {self.image_id} hostel={self.hostel_id}>'
