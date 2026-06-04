from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.hostel import Hostel
from app.models.image import HostelImage
from app.utils.helpers import (
    success_response,
    error_response,
    allowed_file,
    save_image,
    delete_image_file,
    owner_required,
)

images_bp = Blueprint("images", __name__, url_prefix="/api/images")

MAX_IMAGES_PER_HOSTEL = 10


def _assert_hostel_owner(hostel_id: int, owner_id: int):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return None, error_response("Hostel not found.", 404)
    if hostel.owner_id != owner_id:
        return None, error_response("You do not own this hostel.", 403)
    return hostel, None


# ---------------------------------------------------------------------------
# POST /api/images/hostel/<hostel_id>  — upload one or more images [Owner]
# ---------------------------------------------------------------------------
@images_bp.route("/hostel/<int:hostel_id>", methods=["POST"])
@owner_required()
def upload_images(hostel_id):
    owner_id = int(get_jwt_identity())
    hostel, err = _assert_hostel_owner(hostel_id, owner_id)
    if err:
        return err

    files = request.files.getlist("images")
    if not files or all(f.filename == "" for f in files):
        return error_response("No image files provided. Use form-data key 'images'.", 400)

    # Count existing images
    existing_count = HostelImage.query.filter_by(hostel_id=hostel_id).count()
    max_images = current_app.config.get("MAX_IMAGES_PER_HOSTEL", MAX_IMAGES_PER_HOSTEL)

    uploaded = []
    errors = []

    for file in files:
        if file.filename == "":
            continue

        if existing_count + len(uploaded) >= max_images:
            errors.append(f"Max {max_images} images allowed per hostel.")
            break

        if not allowed_file(file.filename):
            errors.append(
                f"'{file.filename}' has an unsupported extension. "
                "Allowed: jpg, jpeg, png, webp."
            )
            continue

        image_url = save_image(file, hostel_id)

        # First image for this hostel becomes primary automatically
        is_primary = existing_count == 0 and len(uploaded) == 0

        img = HostelImage(
            hostel_id=hostel_id,
            image_url=image_url,
            is_primary=is_primary,
        )
        db.session.add(img)
        uploaded.append(img)

    if not uploaded:
        return error_response("No valid images were uploaded.", 400, {"files": errors})

    db.session.commit()

    response_data = {
        "uploaded": [img.to_dict() for img in uploaded],
        "skipped_errors": errors,
    }
    return success_response(
        f"{len(uploaded)} image(s) uploaded successfully.", response_data, 201
    )


# ---------------------------------------------------------------------------
# DELETE /api/images/<image_id>  — [Owner only]
# ---------------------------------------------------------------------------
@images_bp.route("/<int:image_id>", methods=["DELETE"])
@owner_required()
def delete_image(image_id):
    owner_id = int(get_jwt_identity())
    img = db.session.get(HostelImage, image_id)
    if not img:
        return error_response("Image not found.", 404)

    _, err = _assert_hostel_owner(img.hostel_id, owner_id)
    if err:
        return err

    was_primary = img.is_primary
    hostel_id = img.hostel_id

    delete_image_file(img.image_url)
    db.session.delete(img)
    db.session.commit()

    # If the deleted image was primary, promote the next image
    if was_primary:
        next_img = HostelImage.query.filter_by(hostel_id=hostel_id).first()
        if next_img:
            next_img.is_primary = True
            db.session.commit()

    return success_response("Image deleted.")


# ---------------------------------------------------------------------------
# PUT /api/images/<image_id>/primary  — set as primary [Owner only]
# ---------------------------------------------------------------------------
@images_bp.route("/<int:image_id>/primary", methods=["PUT"])
@owner_required()
def set_primary_image(image_id):
    owner_id = int(get_jwt_identity())
    img = db.session.get(HostelImage, image_id)
    if not img:
        return error_response("Image not found.", 404)

    _, err = _assert_hostel_owner(img.hostel_id, owner_id)
    if err:
        return err

    # Clear existing primary flag for this hostel
    HostelImage.query.filter_by(hostel_id=img.hostel_id, is_primary=True).update(
        {"is_primary": False}
    )

    img.is_primary = True
    db.session.commit()

    return success_response("Primary image updated.", {"image": img.to_dict()})
