from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.hostel import Hostel
from app.models.room import Room
from app.utils.helpers import success_response, error_response, owner_required

rooms_bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")


def _assert_hostel_owner(hostel_id: int, owner_id: int):
    """
    Return (hostel, None) if the owner owns the hostel,
    else (None, error_response).
    """
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return None, error_response("Hostel not found.", 404)
    if hostel.owner_id != owner_id:
        return None, error_response("You do not own this hostel.", 403)
    return hostel, None


# ---------------------------------------------------------------------------
# GET /api/rooms/hostel/<hostel_id>  — public
# ---------------------------------------------------------------------------
@rooms_bp.route("/hostel/<int:hostel_id>", methods=["GET"])
def get_rooms(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)

    rooms = Room.query.filter_by(hostel_id=hostel_id).all()
    return success_response(
        "Rooms fetched.",
        {"rooms": [r.to_dict() for r in rooms], "hostel_id": hostel_id},
    )


# ---------------------------------------------------------------------------
# POST /api/rooms/hostel/<hostel_id>  — add room [Owner only]
# ---------------------------------------------------------------------------
@rooms_bp.route("/hostel/<int:hostel_id>", methods=["POST"])
@owner_required()
def add_room(hostel_id):
    owner_id = int(get_jwt_identity())
    hostel, err = _assert_hostel_owner(hostel_id, owner_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    errors = {}

    room_type = data.get("room_type", "")
    rent_raw = data.get("rent")
    capacity_raw = data.get("capacity")
    available_beds_raw = data.get("available_beds", 0)

    if room_type not in ("single", "double", "triple"):
        errors["room_type"] = "room_type must be 'single', 'double', or 'triple'."

    try:
        rent = float(rent_raw)
        if rent < 0:
            errors["rent"] = "Rent must be a positive number."
    except (TypeError, ValueError):
        errors["rent"] = "Rent must be a valid number."
        rent = None

    try:
        capacity = int(capacity_raw)
        if capacity < 1:
            errors["capacity"] = "Capacity must be at least 1."
    except (TypeError, ValueError):
        errors["capacity"] = "Capacity must be a valid integer."
        capacity = None

    try:
        available_beds = int(available_beds_raw)
        if available_beds < 0:
            errors["available_beds"] = "Available beds cannot be negative."
    except (TypeError, ValueError):
        errors["available_beds"] = "Available beds must be a valid integer."
        available_beds = 0

    if errors:
        return error_response("Validation failed.", 400, errors)

    room = Room(
        hostel_id=hostel_id,
        room_type=room_type,
        rent=rent,
        capacity=capacity,
        available_beds=available_beds,
    )
    db.session.add(room)
    db.session.commit()

    return success_response("Room added.", {"room": room.to_dict()}, 201)


# ---------------------------------------------------------------------------
# PUT /api/rooms/<room_id>  — update [Owner only]
# ---------------------------------------------------------------------------
@rooms_bp.route("/<int:room_id>", methods=["PUT"])
@owner_required()
def update_room(room_id):
    owner_id = int(get_jwt_identity())
    room = db.session.get(Room, room_id)
    if not room:
        return error_response("Room not found.", 404)

    _, err = _assert_hostel_owner(room.hostel_id, owner_id)
    if err:
        return err

    data = request.get_json(silent=True) or {}
    errors = {}

    if "room_type" in data:
        if data["room_type"] not in ("single", "double", "triple"):
            errors["room_type"] = "room_type must be 'single', 'double', or 'triple'."
        else:
            room.room_type = data["room_type"]

    if "rent" in data:
        try:
            rent = float(data["rent"])
            if rent < 0:
                errors["rent"] = "Rent must be positive."
            else:
                room.rent = rent
        except (TypeError, ValueError):
            errors["rent"] = "Rent must be a valid number."

    if "capacity" in data:
        try:
            cap = int(data["capacity"])
            if cap < 1:
                errors["capacity"] = "Capacity must be at least 1."
            else:
                room.capacity = cap
        except (TypeError, ValueError):
            errors["capacity"] = "Capacity must be a valid integer."

    if "available_beds" in data:
        try:
            beds = int(data["available_beds"])
            if beds < 0:
                errors["available_beds"] = "Available beds cannot be negative."
            else:
                room.available_beds = beds
        except (TypeError, ValueError):
            errors["available_beds"] = "Available beds must be a valid integer."

    if errors:
        return error_response("Validation failed.", 400, errors)

    db.session.commit()
    return success_response("Room updated.", {"room": room.to_dict()})


# ---------------------------------------------------------------------------
# DELETE /api/rooms/<room_id>  — [Owner only]
# ---------------------------------------------------------------------------
@rooms_bp.route("/<int:room_id>", methods=["DELETE"])
@owner_required()
def delete_room(room_id):
    owner_id = int(get_jwt_identity())
    room = db.session.get(Room, room_id)
    if not room:
        return error_response("Room not found.", 404)

    _, err = _assert_hostel_owner(room.hostel_id, owner_id)
    if err:
        return err

    db.session.delete(room)
    db.session.commit()
    return success_response("Room deleted.")
