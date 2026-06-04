# Import all models so Flask-Migrate / SQLAlchemy can discover them via metadata.
from app.models.user import User
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.image import HostelImage
from app.models.review import Review

__all__ = ["User", "Hostel", "Room", "HostelImage", "Review"]
