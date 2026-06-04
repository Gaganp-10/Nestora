from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db
from app.models.user import User
from app.utils.helpers import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new owner account."""
    data = request.get_json(silent=True) or {}

    # Validation
    errors = {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    phone = (data.get("phone") or "").strip()
    role = data.get("role", "owner")

    if not name:
        errors["name"] = "Name is required."
    if not email:
        errors["email"] = "Email is required."
    if not password or len(password) < 6:
        errors["password"] = "Password must be at least 6 characters."
    if role not in ("owner", "admin"):
        errors["role"] = "Role must be 'owner' or 'admin'."
    if errors:
        return error_response("Validation failed.", 400, errors)

    # Duplicate check
    if User.query.filter_by(email=email).first():
        return error_response("An account with this email already exists.", 409)

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        phone=phone or None,
    )
    db.session.add(user)
    db.session.commit()

    return success_response(
        "Account created successfully.",
        {"user": user.to_dict()},
        201,
    )


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate and return a JWT access token."""
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return error_response("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return error_response("Invalid email or password.", 401)

    # Store role inside JWT claims
    additional_claims = {"role": user.role}
    access_token = create_access_token(
        identity=str(user.user_id),
        additional_claims=additional_claims,
    )

    return success_response(
        "Login successful.",
        {
            "access_token": access_token,
            "token_type": "Bearer",
            "user": user.to_dict(),
        },
    )


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Stateless JWT logout — instructs the client to discard the token.
    For true server-side invalidation you would maintain a token blocklist;
    that is out-of-scope here but the endpoint honours the spec.
    """
    return success_response("Logged out successfully. Please discard your token.")


# ---------------------------------------------------------------------------
# GET /api/auth/profile
# ---------------------------------------------------------------------------
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Return the currently authenticated user's profile."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)
    return success_response("Profile fetched.", {"user": user.to_dict()})


# ---------------------------------------------------------------------------
# PUT /api/auth/profile
# ---------------------------------------------------------------------------
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update name, phone, and/or password for the authenticated user."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)

    data = request.get_json(silent=True) or {}
    errors = {}

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if name:
        user.name = name
    if phone:
        user.phone = phone

    # Password change — require current_password first
    if new_password:
        if not current_password:
            errors["current_password"] = "Current password is required to set a new one."
        elif not check_password_hash(user.password_hash, current_password):
            errors["current_password"] = "Current password is incorrect."
        elif len(new_password) < 6:
            errors["new_password"] = "New password must be at least 6 characters."
        else:
            user.password_hash = generate_password_hash(new_password)

    if errors:
        return error_response("Validation failed.", 400, errors)

    db.session.commit()
    return success_response("Profile updated.", {"user": user.to_dict()})
