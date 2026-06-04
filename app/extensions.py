from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Instantiate extensions without binding to an app yet (app-factory pattern)
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
