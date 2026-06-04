import os
from flask import Flask, jsonify, send_from_directory

from app.config import config_by_name, DevelopmentConfig
from app.extensions import db, migrate, jwt, cors


def create_app(config_name: str = None) -> Flask:
    """
    Flask application factory.

    :param config_name: one of 'development', 'production', 'default'
                        Defaults to the FLASK_ENV environment variable.
    """
    app = Flask(__name__, instance_relative_config=False)

    # ------------------------------------------------------------------ #
    # Config
    # ------------------------------------------------------------------ #
    env = config_name or os.environ.get("FLASK_ENV", "development")
    cfg = config_by_name.get(env, DevelopmentConfig)
    app.config.from_object(cfg)

    # Ensure the uploads folder exists at project root level
    upload_folder = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        app.config["UPLOAD_FOLDER"],
    )
    os.makedirs(upload_folder, exist_ok=True)
    # Store the absolute upload path for helpers
    app.config["UPLOAD_FOLDER"] = upload_folder

    # ------------------------------------------------------------------ #
    # Extensions
    # ------------------------------------------------------------------ #
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]),
        supports_credentials=True,
    )

    # ------------------------------------------------------------------ #
    # Import models so Flask-Migrate discovers them
    # ------------------------------------------------------------------ #
    with app.app_context():
        from app.models import User, Hostel, Room, HostelImage, Review  # noqa: F401

    # ------------------------------------------------------------------ #
    # Blueprints
    # ------------------------------------------------------------------ #
    from app.routes.auth import auth_bp
    from app.routes.hostels import hostels_bp
    from app.routes.rooms import rooms_bp
    from app.routes.images import images_bp
    from app.routes.reviews import reviews_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(hostels_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(images_bp)
    app.register_blueprint(reviews_bp)

    # ------------------------------------------------------------------ #
    # Static uploads route  GET /uploads/<path:filename>
    # ------------------------------------------------------------------ #
    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(upload_folder, filename)

    # ------------------------------------------------------------------ #
    # Health check  GET /api/health
    # ------------------------------------------------------------------ #
    @app.route("/api/health", methods=["GET"])
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            db_status = "connected"
        except Exception as exc:
            db_status = f"error: {exc}"

        return jsonify(
            {
                "success": True,
                "message": "Nestora API is running.",
                "data": {
                    "status": "ok",
                    "database": db_status,
                    "environment": env,
                    "version": "1.0.0",
                },
            }
        ), 200

    # ------------------------------------------------------------------ #
    # JWT error handlers
    # ------------------------------------------------------------------ #
    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify(
            {"success": False, "message": f"Authorization required: {reason}"}
        ), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify(
            {"success": False, "message": f"Invalid token: {reason}"}
        ), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify(
            {"success": False, "message": "Token has expired. Please log in again."}
        ), 401

    # ------------------------------------------------------------------ #
    # Global error handlers
    # ------------------------------------------------------------------ #
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Resource not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "message": "Method not allowed."}), 405

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return (
            jsonify({"success": False, "message": "File too large. Maximum size is 5 MB."}),
            413,
        )

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({"success": False, "message": "Internal server error."}), 500

    return app
