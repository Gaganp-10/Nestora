from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_, or_

from app.extensions import db
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.review import Review
from app.utils.helpers import (
    success_response,
    error_response,
    paginate,
    owner_required,
    delete_hostel_image_folder,
)

hostels_bp = Blueprint("hostels", __name__, url_prefix="/api/hostels")


# ---------------------------------------------------------------------------
# GET /api/hostels/my  — must come BEFORE /<id> so Flask matches it first
# ---------------------------------------------------------------------------
@hostels_bp.route("/my", methods=["GET"])
@jwt_required()
def my_hostels():
    """Return all hostel listings owned by the authenticated user."""
    owner_id = int(get_jwt_identity())
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 12))

    query = Hostel.query.filter_by(owner_id=owner_id).order_by(
        Hostel.created_at.desc()
    )
    result = paginate(query, page, per_page)
    return success_response(
        "Your listings fetched.",
        {
            "hostels": [h.to_dict() for h in result["items"]],
            "total": result["total"],
            "page": result["page"],
            "pages": result["pages"],
            "per_page": result["per_page"],
        },
    )


# ---------------------------------------------------------------------------
# GET /api/hostels  — public listing with filters
# ---------------------------------------------------------------------------
@hostels_bp.route("", methods=["GET"])
def list_hostels():
    """
    Public endpoint.  Supports query params:
    search, city, area, gender, room_type, min_rent, max_rent,
    min_rating, available, page, per_page
    """
    args = request.args

    page = max(int(args.get("page", 1)), 1)
    per_page = min(int(args.get("per_page", 12)), 50)

    query = Hostel.query.filter_by(is_active=True)

    # ── text search ──────────────────────────────────────────────────────
    search = (args.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Hostel.hostel_name.ilike(like),
                Hostel.city.ilike(like),
                Hostel.area.ilike(like),
            )
        )

    # ── exact filters ────────────────────────────────────────────────────
    city = (args.get("city") or "").strip()
    if city:
        query = query.filter(Hostel.city.ilike(city))

    area = (args.get("area") or "").strip()
    if area:
        query = query.filter(Hostel.area.ilike(area))

    gender = (args.get("gender") or "").strip()
    if gender and gender in ("male", "female", "co-ed"):
        query = query.filter(Hostel.gender == gender)

    # ── room-level filters (join with rooms) ─────────────────────────────
    room_type = (args.get("room_type") or "").strip()
    min_rent_raw = args.get("min_rent")
    max_rent_raw = args.get("max_rent")
    available = args.get("available", "").lower() == "true"

    needs_room_join = room_type or min_rent_raw or max_rent_raw or available
    if needs_room_join:
        room_conditions = [Room.hostel_id == Hostel.hostel_id]

        if room_type and room_type in ("single", "double", "triple"):
            room_conditions.append(Room.room_type == room_type)

        if min_rent_raw:
            try:
                room_conditions.append(Room.rent >= float(min_rent_raw))
            except ValueError:
                pass

        if max_rent_raw:
            try:
                room_conditions.append(Room.rent <= float(max_rent_raw))
            except ValueError:
                pass

        if available:
            room_conditions.append(Room.available_beds > 0)

        query = query.join(Room, and_(*room_conditions)).distinct()

    # ── rating filter ─────────────────────────────────────────────────────
    min_rating_raw = args.get("min_rating")
    if min_rating_raw:
        try:
            min_rating = float(min_rating_raw)
            # Subquery: avg rating per hostel
            avg_subq = (
                db.session.query(
                    Review.hostel_id,
                    func.avg(Review.rating).label("avg_rating"),
                )
                .group_by(Review.hostel_id)
                .subquery()
            )
            query = query.join(
                avg_subq, Hostel.hostel_id == avg_subq.c.hostel_id
            ).filter(avg_subq.c.avg_rating >= min_rating)
        except ValueError:
            pass

    query = query.order_by(Hostel.created_at.desc())
    result = paginate(query, page, per_page)

    return success_response(
        "Hostels fetched.",
        {
            "hostels": [h.to_dict() for h in result["items"]],
            "total": result["total"],
            "page": result["page"],
            "pages": result["pages"],
            "per_page": result["per_page"],
        },
    )


# ---------------------------------------------------------------------------
# GET /api/hostels/<id>  — public detail
# ---------------------------------------------------------------------------
@hostels_bp.route("/<int:hostel_id>", methods=["GET"])
def get_hostel(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)
    return success_response("Hostel detail fetched.", {"hostel": hostel.to_detail_dict()})


# ---------------------------------------------------------------------------
# POST /api/hostels  — create [Owner only]
# ---------------------------------------------------------------------------
@hostels_bp.route("", methods=["POST"])
@owner_required()
def create_hostel():
    owner_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    errors = {}
    hostel_name = (data.get("hostel_name") or "").strip()
    city = (data.get("city") or "").strip()
    area = (data.get("area") or "").strip()
    address = (data.get("address") or "").strip()
    gender = data.get("gender", "co-ed")
    description = (data.get("description") or "").strip() or None
    contact_phone = (data.get("contact_phone") or "").strip() or None

    if not hostel_name:
        errors["hostel_name"] = "Hostel name is required."
    if not city:
        errors["city"] = "City is required."
    if not area:
        errors["area"] = "Area is required."
    if not address:
        errors["address"] = "Address is required."
    if gender not in ("male", "female", "co-ed"):
        errors["gender"] = "Gender must be 'male', 'female', or 'co-ed'."
    if errors:
        return error_response("Validation failed.", 400, errors)

    hostel = Hostel(
        owner_id=owner_id,
        hostel_name=hostel_name,
        description=description,
        city=city,
        area=area,
        address=address,
        contact_phone=contact_phone,
        gender=gender,
        is_active=data.get("is_active", True),
    )
    db.session.add(hostel)
    db.session.commit()

    return success_response(
        "Hostel created successfully.",
        {"hostel": hostel.to_detail_dict()},
        201,
    )


# ---------------------------------------------------------------------------
# PUT /api/hostels/<id>  — update [Owner only, own listing]
# ---------------------------------------------------------------------------
@hostels_bp.route("/<int:hostel_id>", methods=["PUT"])
@owner_required()
def update_hostel(hostel_id):
    owner_id = int(get_jwt_identity())
    hostel = db.session.get(Hostel, hostel_id)

    if not hostel:
        return error_response("Hostel not found.", 404)
    if hostel.owner_id != owner_id:
        return error_response("You do not own this listing.", 403)

    data = request.get_json(silent=True) or {}
    errors = {}

    # Only update provided fields
    if "hostel_name" in data:
        v = (data["hostel_name"] or "").strip()
        if not v:
            errors["hostel_name"] = "Hostel name cannot be empty."
        else:
            hostel.hostel_name = v

    if "city" in data:
        v = (data["city"] or "").strip()
        if not v:
            errors["city"] = "City cannot be empty."
        else:
            hostel.city = v

    if "area" in data:
        v = (data["area"] or "").strip()
        if not v:
            errors["area"] = "Area cannot be empty."
        else:
            hostel.area = v

    if "address" in data:
        v = (data["address"] or "").strip()
        if not v:
            errors["address"] = "Address cannot be empty."
        else:
            hostel.address = v

    if "gender" in data:
        v = data["gender"]
        if v not in ("male", "female", "co-ed"):
            errors["gender"] = "Gender must be 'male', 'female', or 'co-ed'."
        else:
            hostel.gender = v

    if "description" in data:
        hostel.description = (data["description"] or "").strip() or None

    if "contact_phone" in data:
        hostel.contact_phone = (data["contact_phone"] or "").strip() or None

    if "is_active" in data:
        hostel.is_active = bool(data["is_active"])

    if errors:
        return error_response("Validation failed.", 400, errors)

    db.session.commit()
    return success_response("Hostel updated.", {"hostel": hostel.to_detail_dict()})


# ---------------------------------------------------------------------------
# DELETE /api/hostels/<id>  — delete [Owner only, own listing]
# ---------------------------------------------------------------------------
@hostels_bp.route("/<int:hostel_id>", methods=["DELETE"])
@owner_required()
def delete_hostel(hostel_id):
    owner_id = int(get_jwt_identity())
    hostel = db.session.get(Hostel, hostel_id)

    if not hostel:
        return error_response("Hostel not found.", 404)
    if hostel.owner_id != owner_id:
        return error_response("You do not own this listing.", 403)

    # Remove all images from disk before removing the DB record
    delete_hostel_image_folder(hostel_id)

    db.session.delete(hostel)
    db.session.commit()

    return success_response("Hostel deleted successfully.")
