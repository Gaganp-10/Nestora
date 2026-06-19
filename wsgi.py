"""
wsgi.py — PythonAnywhere WSGI entry point for Nestora backend.

PythonAnywhere looks for a module-level variable called `application`
that is a WSGI-callable. This file sets that up using Flask's create_app.

Usage (PythonAnywhere WSGI config file):
    Simply point the WSGI file content to this file, or paste this file's
    content directly into the PythonAnywhere WSGI editor.
"""

import sys
import os

# ── Add project root to Python path ──────────────────────────────────────────
project_home = '/home/Gaganp10/Nestora'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# ── Force production environment ──────────────────────────────────────────────
os.environ['FLASK_ENV'] = 'production'

# ── Load .env file if present (for local overrides on PythonAnywhere) ─────────
from dotenv import load_dotenv
load_dotenv(os.path.join(project_home, '.env'))

# ── Create the Flask application ─────────────────────────────────────────────
from app import create_app

application = create_app('production')
