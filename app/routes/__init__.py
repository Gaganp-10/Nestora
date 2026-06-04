from app.routes.auth import auth_bp
from app.routes.hostels import hostels_bp
from app.routes.rooms import rooms_bp
from app.routes.images import images_bp
from app.routes.reviews import reviews_bp

__all__ = ["auth_bp", "hostels_bp", "rooms_bp", "images_bp", "reviews_bp"]
