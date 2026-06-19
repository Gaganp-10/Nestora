"""
app/routes/admin.py — Complete Admin API
All routes require admin JWT token via @admin_required()
"""
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func, or_

from app.extensions import db
from app.models.user import User
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.review import Review
from app.models.image import HostelImage
from app.utils.helpers import (
    success_response,
    error_response,
    paginate,
    admin_required,
    delete_hostel_image_folder,
)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ─────────────────────────────────────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@admin_required()
def get_stats():
    """Global platform statistics for the admin dashboard."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users   = User.query.count()
    total_owners  = User.query.filter_by(role="owner").count()
    total_hostels = Hostel.query.count()
    active_hostels = Hostel.query.filter_by(is_active=True).count()
    total_rooms   = Room.query.count()
    total_reviews = Review.query.count()
    total_beds    = db.session.query(func.sum(Room.available_beds)).scalar() or 0
    cities = db.session.query(func.count(func.distinct(Hostel.city))).scalar() or 0

    avg_rating_raw = db.session.query(func.avg(Review.rating)).scalar()
    avg_rating = round(float(avg_rating_raw), 1) if avg_rating_raw else 0.0

    new_users_month   = User.query.filter(User.created_at >= month_start).count()
    new_hostels_month = Hostel.query.filter(Hostel.created_at >= month_start).count()

    # Recent data (last 5)
    recent_hostels = Hostel.query.order_by(Hostel.created_at.desc()).limit(5).all()
    recent_reviews = Review.query.order_by(Review.created_at.desc()).limit(5).all()
    recent_users   = User.query.order_by(User.created_at.desc()).limit(5).all()

    def hostel_summary(h):
        return {
            "hostel_id":   h.hostel_id,
            "hostel_name": h.hostel_name,
            "city":        h.city,
            "is_active":   h.is_active,
            "created_at":  h.created_at.isoformat() if h.created_at else None,
            "owner_name":  h.owner.name if h.owner else "—",
        }

    def review_summary(r):
        hostel_name = r.hostel.hostel_name if r.hostel else "—"
        return {
            "review_id":     r.review_id,
            "hostel_name":   hostel_name,
            "hostel_id":     r.hostel_id,
            "reviewer_name": r.reviewer_name,
            "rating":        r.rating,
            "comment":       r.comment,
            "created_at":    r.created_at.isoformat() if r.created_at else None,
        }

    return success_response("Stats fetched.", {
        "total_users":           total_users,
        "total_owners":          total_owners,
        "total_hostels":         total_hostels,
        "active_hostels":        active_hostels,
        "total_rooms":           total_rooms,
        "total_reviews":         total_reviews,
        "average_rating":        avg_rating,
        "total_available_beds":  int(total_beds),
        "cities_covered":        cities,
        "new_users_this_month":  new_users_month,
        "new_hostels_this_month": new_hostels_month,
        "recent_hostels": [hostel_summary(h) for h in recent_hostels],
        "recent_reviews": [review_summary(r) for r in recent_reviews],
        "recent_users":   [u.to_dict() for u in recent_users],
    })


# ─────────────────────────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route("/users", methods=["GET"])
@admin_required()
def list_users():
    args     = request.args
    page     = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 20)), 100)
    search   = (args.get("search") or "").strip()
    role     = (args.get("role") or "").strip()

    query = User.query

    if search:
        like = f"%{search}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))

    if role in ("owner", "admin"):
        query = query.filter_by(role=role)

    query = query.order_by(User.created_at.desc())
    result = paginate(query, page, per_page)

    def user_with_hostels(u):
        d = u.to_dict()
        d["hostel_count"] = u.hostels.count()
        return d

    return success_response("Users fetched.", {
        "users":    [user_with_hostels(u) for u in result["items"]],
        "total":    result["total"],
        "page":     result["page"],
        "pages":    result["pages"],
        "per_page": result["per_page"],
    })


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required()
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)

    hostels = Hostel.query.filter_by(owner_id=user_id).all()
    data = user.to_dict()
    data["hostels"] = [h.to_dict() for h in hostels]
    return success_response("User detail fetched.", {"user": data})


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required()
def delete_user(user_id):
    current_admin_id = int(get_jwt_identity())

    if user_id == current_admin_id:
        return error_response("You cannot delete your own account.", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)

    if user.role == "admin":
        return error_response("Admin accounts cannot be deleted.", 403)

    # Delete all hostel image folders from disk
    for hostel in user.hostels:
        delete_hostel_image_folder(hostel.hostel_id)

    db.session.delete(user)
    db.session.commit()
    return success_response(f"User '{user.name}' and all their data deleted.")


@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["PUT"])
@admin_required()
def toggle_user_status(user_id):
    current_admin_id = int(get_jwt_identity())

    if user_id == current_admin_id:
        return error_response("You cannot toggle your own status.", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)

    if not hasattr(user, "is_active"):
        return error_response("User model does not support is_active toggle.", 400)

    user.is_active = not getattr(user, "is_active", True)
    db.session.commit()
    status = "activated" if user.is_active else "deactivated"
    return success_response(f"User {status}.", {"user": user.to_dict()})


# ─────────────────────────────────────────────────────────────────────────────
# HOSTELS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route("/hostels", methods=["GET"])
@admin_required()
def list_hostels():
    args     = request.args
    page     = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 20)), 100)
    search   = (args.get("search") or "").strip()
    city     = (args.get("city") or "").strip()
    status   = (args.get("status") or "").strip()

    query = Hostel.query

    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            Hostel.hostel_name.ilike(like),
            Hostel.city.ilike(like),
            Hostel.area.ilike(like),
        ))

    if city:
        query = query.filter(Hostel.city.ilike(city))

    if status == "active":
        query = query.filter_by(is_active=True)
    elif status == "inactive":
        query = query.filter_by(is_active=False)

    query = query.order_by(Hostel.created_at.desc())
    result = paginate(query, page, per_page)

    def hostel_admin_dict(h):
        d = h.to_dict()
        d["owner_name"]    = h.owner.name  if h.owner else "—"
        d["owner_email"]   = h.owner.email if h.owner else "—"
        d["room_count"]    = len(h.rooms)
        d["review_count"]  = h.reviews.count()
        return d

    return success_response("Hostels fetched.", {
        "hostels":  [hostel_admin_dict(h) for h in result["items"]],
        "total":    result["total"],
        "page":     result["page"],
        "pages":    result["pages"],
        "per_page": result["per_page"],
    })


@admin_bp.route("/hostels/<int:hostel_id>", methods=["DELETE"])
@admin_required()
def delete_hostel(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)

    delete_hostel_image_folder(hostel_id)
    db.session.delete(hostel)
    db.session.commit()
    return success_response(f"Hostel '{hostel.hostel_name}' deleted.")


@admin_bp.route("/hostels/<int:hostel_id>/toggle-status", methods=["PUT"])
@admin_required()
def toggle_hostel_status(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)

    hostel.is_active = not hostel.is_active
    db.session.commit()
    status = "activated" if hostel.is_active else "deactivated"
    return success_response(f"Hostel {status}.", {"hostel": hostel.to_dict()})


# ─────────────────────────────────────────────────────────────────────────────
# REVIEWS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.route("/reviews", methods=["GET"])
@admin_required()
def list_reviews():
    args       = request.args
    page       = max(int(args.get("page", 1)), 1)
    per_page   = min(int(args.get("per_page", 20)), 100)
    min_rating = args.get("min_rating")
    max_rating = args.get("max_rating")

    query = Review.query

    if min_rating:
        try:
            query = query.filter(Review.rating >= int(min_rating))
        except ValueError:
            pass

    if max_rating:
        try:
            query = query.filter(Review.rating <= int(max_rating))
        except ValueError:
            pass

    query = query.order_by(Review.created_at.desc())
    result = paginate(query, page, per_page)

    def review_admin_dict(r):
        d = r.to_dict()
        d["hostel_name"] = r.hostel.hostel_name if r.hostel else "—"
        return d

    return success_response("Reviews fetched.", {
        "reviews":  [review_admin_dict(r) for r in result["items"]],
        "total":    result["total"],
        "page":     result["page"],
        "pages":    result["pages"],
        "per_page": result["per_page"],
    })


@admin_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@admin_required()
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return error_response("Review not found.", 404)

    db.session.delete(review)
    db.session.commit()
    return success_response("Review deleted.")
