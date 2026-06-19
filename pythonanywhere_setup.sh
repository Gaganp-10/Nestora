#!/bin/bash
# pythonanywhere_setup.sh
# Run this script once inside a PythonAnywhere Bash console to set up Nestora.
# Usage:  bash pythonanywhere_setup.sh

set -e   # exit on any error

PROJECT_DIR="/home/Gaganp10/Nestora"
VENV_DIR="$PROJECT_DIR/venv"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Nestora — PythonAnywhere Setup Script  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Navigate to project ────────────────────────────────────────────────────
cd "$PROJECT_DIR"
echo "✅ Changed to project directory: $PROJECT_DIR"

# ── 2. Create virtual environment ─────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    python3.11 -m venv venv
    echo "✅ Virtual environment created at $VENV_DIR"
else
    echo "ℹ️  Virtual environment already exists, skipping creation."
fi

# ── 3. Activate virtual environment ───────────────────────────────────────────
source venv/bin/activate
echo "✅ Virtual environment activated"

# ── 4. Upgrade pip ────────────────────────────────────────────────────────────
pip install --upgrade pip --quiet
echo "✅ pip upgraded"

# ── 5. Install dependencies ────────────────────────────────────────────────────
echo "📦 Installing Python packages (this may take a minute)..."
pip install -r requirements.txt --quiet
echo "✅ All packages installed"

# ── 6. Check .env file exists ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  WARNING: .env file not found!"
    echo "   Please create it now with your database credentials:"
    echo ""
    echo "   cat > .env << 'EOF'"
    echo "   FLASK_ENV=production"
    echo "   SECRET_KEY=nestora-production-secret-key-2024"
    echo "   DATABASE_URL=mysql+pymysql://Gaganp10:YOUR_DB_PASSWORD@Gaganp10.mysql.pythonanywhere-services.com/Gaganp10\$nestora_db"
    echo "   JWT_SECRET_KEY=nestora-jwt-production-secret-2024"
    echo "   CLOUDINARY_CLOUD_NAME=dgonwgxfg"
    echo "   CLOUDINARY_API_KEY=669463342352811"
    echo "   CLOUDINARY_API_SECRET=VuZ3iyS75KbclzxjPbt8K1dUr1U"
    echo "   EOF"
    echo ""
    echo "   Then re-run: bash pythonanywhere_setup.sh"
    exit 1
fi
echo "✅ .env file found"

# ── 7. Set FLASK_APP for CLI commands ─────────────────────────────────────────
export FLASK_APP=wsgi:application
export FLASK_ENV=production

# ── 8. Run database migrations ────────────────────────────────────────────────
echo "🗄️  Running database migrations..."
flask db upgrade
echo "✅ Migrations applied"

# ── 9. Create admin user if script exists ─────────────────────────────────────
if [ -f "create_admin.py" ]; then
    echo "👤 Creating admin user..."
    python create_admin.py
    echo "✅ Admin user created"
fi

# ── 10. Seed initial data if seed script exists ───────────────────────────────
if [ -f "seed.py" ]; then
    echo "🌱 Seeding initial data..."
    python seed.py
    echo "✅ Database seeded"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅  Setup complete! Reload your web    ║"
echo "║   app from the PythonAnywhere Web tab.   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "🔗 Visit: https://Gaganp10.pythonanywhere.com/api/health"
