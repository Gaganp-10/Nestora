from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.hostel import Hostel
from app.models.review import Review
from app.utils.helpers import (
    success_response,
    error_response,
    paginate,
    admin_required,
)

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


# ---------------------------------------------------------------------------
# GET /api/reviews/hostel/<hostel_id>  — public
# ---------------------------------------------------------------------------
@reviews_bp.route("/hostel/<int:hostel_id>", methods=["GET"])
def get_reviews(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(int(request.args.get("per_page", 20)), 50)

    query = Review.query.filter_by(hostel_id=hostel_id).order_by(
        Review.created_at.desc()
    )
    result = paginate(query, page, per_page)

    return success_response(
        "Reviews fetched.",
        {
            "reviews": [r.to_dict() for r in result["items"]],
            "total": result["total"],
            "page": result["page"],
            "pages": result["pages"],
            "per_page": result["per_page"],
            "hostel_id": hostel_id,
        },
    )


# ---------------------------------------------------------------------------
# POST /api/reviews/hostel/<hostel_id>  — public (no auth required)
# ---------------------------------------------------------------------------
@reviews_bp.route("/hostel/<int:hostel_id>", methods=["POST"])
def post_review(hostel_id):
    hostel = db.session.get(Hostel, hostel_id)
    if not hostel:
        return error_response("Hostel not found.", 404)

    data = request.get_json(silent=True) or {}
    errors = {}

    reviewer_name = (data.get("reviewer_name") or "").strip()
    rating_raw = data.get("rating")
    comment = (data.get("comment") or "").strip() or None

    if not reviewer_name:
        errors["reviewer_name"] = "Reviewer name is required."

    try:
        rating = int(rating_raw)
        if not (1 <= rating <= 5):
            errors["rating"] = "Rating must be between 1 and 5."
    except (TypeError, ValueError):
        errors["rating"] = "Rating must be an integer between 1 and 5."
        rating = None

    if errors:
        return error_response("Validation failed.", 400, errors)

    review = Review(
        hostel_id=hostel_id,
        reviewer_name=reviewer_name,
        rating=rating,
        comment=comment,
    )
    db.session.add(review)
    db.session.commit()

    return success_response("Review posted.", {"review": review.to_dict()}, 201)


# ---------------------------------------------------------------------------
# DELETE /api/reviews/<review_id>  — Admin only
# ---------------------------------------------------------------------------
@reviews_bp.route("/<int:review_id>", methods=["DELETE"])
@admin_required()
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if not review:
        return error_response("Review not found.", 404)

    db.session.delete(review)
    db.session.commit()
    return success_response("Review deleted.")
