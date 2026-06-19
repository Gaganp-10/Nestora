import os
import uuid
from functools import wraps
from flask import current_app, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import verify_jwt_in_request, get_jwt


# ---------------------------------------------------------------------------
# File upload helpers
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_WIDTH_PX = 1200


def allowed_file(filename: str) -> bool:
    """Return True if the file extension is in the allowed set."""
    allowed = current_app.config.get('ALLOWED_EXTENSIONS', ALLOWED_EXTENSIONS)
    return (
        '.' in filename
        and filename.rsplit('.', 1)[1].lower() in allowed
    )


def _configure_cloudinary():
    """Configure the Cloudinary SDK from Flask app config."""
    import cloudinary
    cloudinary.config(
        cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=current_app.config['CLOUDINARY_API_KEY'],
        api_secret=current_app.config['CLOUDINARY_API_SECRET'],
        secure=True,
    )


def save_image(file, hostel_id: int) -> str:
    """
    Persist an uploaded FileStorage object.

    In PRODUCTION  → uploads to Cloudinary and returns the secure Cloudinary URL.
    In DEVELOPMENT → saves to local disk and returns the relative URL path.

    Returns the URL string to be stored in the database.
    """
    env = os.environ.get('FLASK_ENV', 'development')

    if env == 'production':
        # ── Cloudinary upload ──────────────────────────────────────────────
        import cloudinary.uploader
        _configure_cloudinary()

        result = cloudinary.uploader.upload(
            file,
            folder=f'nestora/hostels/{hostel_id}',
            transformation=[
                {'width': 1200, 'crop': 'limit'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
            ],
        )
        return result['secure_url']

    else:
        # ── Local disk storage (development) ───────────────────────────────
        upload_root = current_app.config['UPLOAD_FOLDER']
        hostel_dir = os.path.join(upload_root, str(hostel_id))
        os.makedirs(hostel_dir, exist_ok=True)

        ext = secure_filename(file.filename).rsplit('.', 1)[1].lower()
        filename = f'{uuid.uuid4().hex}.{ext}'
        save_path = os.path.join(hostel_dir, filename)

        try:
            from PIL import Image as PILImage

            img = PILImage.open(file.stream)

            # Convert palette / RGBA → RGB for JPEG compatibility
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            if img.width > MAX_IMAGE_WIDTH_PX:
                ratio = MAX_IMAGE_WIDTH_PX / img.width
                new_height = int(img.height * ratio)
                img = img.resize((MAX_IMAGE_WIDTH_PX, new_height), PILImage.LANCZOS)

            save_kwargs = {'optimize': True}
            if ext in ('jpg', 'jpeg'):
                save_kwargs['quality'] = 85
            img.save(save_path, **save_kwargs)

        except ImportError:
            # Pillow not installed — save as-is
            file.seek(0)
            file.save(save_path)

        return f'/uploads/{hostel_id}/{filename}'


def delete_image_file(image_url: str) -> None:
    """
    Remove an image from storage given its URL.

    In production (Cloudinary URL starting with 'https://res.cloudinary.com'):
      → destroys the asset via Cloudinary API.
    In development:
      → removes the file from local disk.
    Silently ignores missing files / assets.
    """
    if not image_url:
        return

    if image_url.startswith('https://res.cloudinary.com'):
        # ── Cloudinary delete ──────────────────────────────────────────────
        try:
            import cloudinary.uploader
            _configure_cloudinary()
            # Extract public_id: everything after /upload/vXXXX/ up to extension
            parts = image_url.split('/upload/')
            if len(parts) == 2:
                public_id_with_ext = parts[1]
                # Strip version segment (v12345/) if present
                segments = public_id_with_ext.split('/')
                if segments[0].startswith('v') and segments[0][1:].isdigit():
                    segments = segments[1:]
                public_id = '/'.join(segments).rsplit('.', 1)[0]
                cloudinary.uploader.destroy(public_id)
        except Exception:
            pass  # Best-effort; don't crash on delete failures
    else:
        # ── Local disk delete ──────────────────────────────────────────────
        rel_path = image_url.lstrip('/')
        abs_path = os.path.join(current_app.root_path, '..', rel_path)
        abs_path = os.path.normpath(abs_path)
        if os.path.isfile(abs_path):
            os.remove(abs_path)


def delete_hostel_image_folder(hostel_id: int) -> None:
    """Remove the entire uploads/<hostel_id>/ directory on hostel delete (dev only)."""
    import shutil

    upload_root = current_app.config['UPLOAD_FOLDER']
    hostel_dir = os.path.join(upload_root, str(hostel_id))
    abs_dir = os.path.normpath(os.path.join(current_app.root_path, '..', hostel_dir))
    if os.path.isdir(abs_dir):
        shutil.rmtree(abs_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Pagination helper
# ---------------------------------------------------------------------------

def paginate(query, page: int, per_page: int, max_per_page: int = 50):
    per_page = min(per_page, max_per_page)
    page = max(page, 1)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': pagination.items,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': pagination.per_page,
    }


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def success_response(message: str, data=None, status_code: int = 200):
    body = {'success': True, 'message': message}
    if data is not None:
        body['data'] = data
    return jsonify(body), status_code


def error_response(message: str, status_code: int = 400, errors=None):
    body = {'success': False, 'message': message}
    if errors is not None:
        body['errors'] = errors
    return jsonify(body), status_code


# ---------------------------------------------------------------------------
# JWT / auth decorators
# ---------------------------------------------------------------------------

def owner_required():
    """Decorator: only users with role == 'owner' may proceed."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != 'owner':
                return error_response('Owner access required.', 403)
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
            if claims.get('role') != 'admin':
                return error_response('Admin access required.', 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
