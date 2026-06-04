import os
import uuid
from flask import current_app, request, jsonify
from werkzeug.utils import secure_filename


# ---------------------------------------------------------------------------
# File upload helpers
# ---------------------------------------------------------------------------

def allowed_file(filename: str) -> bool:
    """Return True if the file extension is in the allowed set."""
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", {"jpg", "jpeg", "png", "webp"})
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed
    )


def save_image(file, hostel_id: int) -> str:
    """
    Persist an uploaded FileStorage object to disk.

    Files are saved to:  uploads/<hostel_id>/<uuid4>.<ext>

    Returns the relative URL path:  /uploads/<hostel_id>/<uuid4>.<ext>
    """
    upload_root = current_app.config["UPLOAD_FOLDER"]
    hostel_dir = os.path.join(upload_root, str(hostel_id))
    os.makedirs(hostel_dir, exist_ok=True)

    ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(hostel_dir, filename)
    file.save(save_path)

    # Return a relative URL that Flask will serve via the /uploads static route
    return f"/uploads/{hostel_id}/{filename}"


def delete_image_file(image_url: str) -> None:
    """
    Remove an image from disk given its relative URL path.

    Silently ignores missing files so callers don't need to guard.
    """
    if not image_url:
        return
    # Strip leading slash and build absolute path
    rel_path = image_url.lstrip("/")
    abs_path = os.path.join(current_app.root_path, "..", rel_path)
    abs_path = os.path.normpath(abs_path)
    if os.path.isfile(abs_path):
        os.remove(abs_path)


def delete_hostel_image_folder(hostel_id: int) -> None:
    """Remove the entire uploads/<hostel_id>/ directory on hostel delete."""
    import shutil

    upload_root = current_app.config["UPLOAD_FOLDER"]
    hostel_dir = os.path.join(upload_root, str(hostel_id))
    # Build absolute path relative to the project root (one level above app/)
    abs_dir = os.path.normpath(os.path.join(current_app.root_path, "..", hostel_dir))
    if os.path.isdir(abs_dir):
        shutil.rmtree(abs_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Pagination helper
# ---------------------------------------------------------------------------

def paginate(query, page: int, per_page: int, max_per_page: int = 50):
    """
    Return a dict with paginated ORM results.

    :param query:       SQLAlchemy query object
    :param page:        current page number (1-indexed)
    :param per_page:    items per page requested
    :param max_per_page: hard ceiling on per_page
    :returns:           dict with keys: items, total, page, pages, per_page
    """
    per_page = min(per_page, max_per_page)
    page = max(page, 1)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": pagination.items,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": pagination.per_page,
    }


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def success_response(message: str, data=None, status_code: int = 200):
    """Construct a standard success JSON response."""
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), status_code


def error_response(message: str, status_code: int = 400, errors=None):
    """Construct a standard error JSON response."""
    body = {"success": False, "message": message}
    if errors is not None:
        body["errors"] = errors
    return jsonify(body), status_code


# ---------------------------------------------------------------------------
# JWT / auth decorators
# ---------------------------------------------------------------------------

from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def owner_required():
    """Decorator: only users with role == 'owner' may proceed."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "owner":
                return error_response("Owner access required.", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required():
    """Decorator: only users with role == 'admin' may proceed."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "admin":
                return error_response("Admin access required.", 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
