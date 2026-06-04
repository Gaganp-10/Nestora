"""
setup_database.py — One-shot Nestora database setup tool.

Run once (or safely re-run) to:
  1. Read .env
  2. Create the MySQL database
  3. Run Flask-Migrate migrations
  4. Seed sample data
  5. Verify table row counts
"""

import os
import sys
import subprocess
from pathlib import Path
from urllib.parse import urlparse, unquote

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def banner():
    print()
    print("=" * 48)
    print("🚀  NESTORA DATABASE SETUP TOOL")
    print("=" * 48)
    print()


def ok(msg):
    print(f"  ✅  {msg}")


def fail(msg):
    print(f"\n  ❌  ERROR: {msg}\n")
    sys.exit(1)


def section(title):
    print(f"\n{'─' * 48}")
    print(f"  {title}")
    print(f"{'─' * 48}")


# ---------------------------------------------------------------------------
# STEP 1 — Read .env
# ---------------------------------------------------------------------------

def load_env():
    section("STEP 1 — Reading .env file")

    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        fail(
            ".env file not found in the project root.\n"
            "       Copy .env.example to .env and fill in your credentials."
        )

    # Manual parse (avoids needing python-dotenv at import time)
    env_vars: dict[str, str] = {}
    with env_path.open(encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env_vars[key.strip()] = value.strip().strip('"').strip("'")

    database_url = env_vars.get("DATABASE_URL", "")
    if not database_url:
        fail(
            "DATABASE_URL not found in .env.\n"
            "       Expected format: mysql+pymysql://root:PASSWORD@localhost/nestora_db"
        )

    # Parse connection components — handle URL-encoded passwords (e.g. @ → %40)
    try:
        parsed = urlparse(database_url)
        db_user     = unquote(parsed.username or "root")
        db_password = unquote(parsed.password or "")
        db_host     = parsed.hostname or "localhost"
        db_port     = parsed.port or 3306
        db_name     = parsed.path.lstrip("/") or "nestora_db"
    except Exception as exc:
        fail(f"Could not parse DATABASE_URL: {exc}")

    print(f"  📋  Host     : {db_host}:{db_port}")
    print(f"  📋  User     : {db_user}")
    print(f"  📋  Database : {db_name}")
    print(f"  📋  Password : {'*' * len(db_password)}")

    # Also export to environment so Flask/SQLAlchemy subcommands pick them up
    os.environ.update(env_vars)

    ok(".env read successfully")
    return db_user, db_password, db_host, db_port, db_name


# ---------------------------------------------------------------------------
# STEP 2 — Create the database
# ---------------------------------------------------------------------------

def create_database(user, password, host, port, dbname):
    section("STEP 2 — Creating the MySQL database")

    try:
        import pymysql
    except ImportError:
        fail(
            "PyMySQL is not installed.\n"
            "       Run:  pip install pymysql"
        )

    try:
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            connect_timeout=10,
        )
    except pymysql.err.OperationalError as exc:
        code = exc.args[0]
        if code == 2003:
            fail(
                "MySQL is not running. Start MySQL service first.\n"
                "       In PowerShell (admin):  net start MySQL80\n"
                "       Or open 'Services' and start 'MySQL80'."
            )
        elif code in (1045, 1044):
            fail(
                f"Wrong MySQL credentials for user '{user}'.\n"
                "       Open .env and fix DATABASE_URL (check password)."
            )
        else:
            fail(f"Cannot connect to MySQL ({exc})")

    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        print(f"  📦  Database `{dbname}` is ready.")

    conn.close()
    ok(f"Database '{dbname}' created successfully")


# ---------------------------------------------------------------------------
# STEP 3 — Flask DB migrations
# ---------------------------------------------------------------------------

def run_migrations():
    section("STEP 3 — Running Flask DB migrations")

    project_dir = Path(__file__).parent
    migrations_dir = project_dir / "migrations"

    env = {**os.environ, "FLASK_APP": "run.py", "FLASK_ENV": "development"}

    def run(cmd, *, description, capture=False):
        print(f"  ⚙   {description} …")
        result = subprocess.run(
            cmd,
            cwd=str(project_dir),
            env=env,
            shell=True,
            capture_output=capture,
            text=True,
        )
        if result.returncode != 0:
            stderr = (result.stderr or "").strip()
            stdout = (result.stdout or "").strip()
            detail = stderr or stdout
            fail(
                f"Command failed: {' '.join(cmd) if isinstance(cmd, list) else cmd}\n"
                f"       {detail}"
            )
        return result

    # flask db init — skip if migrations folder already exists and is populated
    if not (migrations_dir / "env.py").exists():
        print("  ℹ   No migrations folder found — running 'flask db init'")
        run("flask db init", description="Initialising migrations folder")
    else:
        print("  ℹ   migrations/ folder already exists — skipping 'flask db init'")

    # flask db migrate
    result = run(
        'flask db migrate -m "initial migration"',
        description="Generating migration script",
        capture=True,
    )
    output = (result.stdout + result.stderr).lower()
    if "no changes in schema detected" in output:
        print("  ℹ   Schema already up to date — no new migration generated.")

    # flask db upgrade
    run("flask db upgrade", description="Applying migrations to database")

    ok("All tables created successfully")


# ---------------------------------------------------------------------------
# STEP 4 — Seed data
# ---------------------------------------------------------------------------

def run_seed():
    section("STEP 4 — Running seed data")

    project_dir = Path(__file__).parent
    env = {**os.environ, "FLASK_APP": "run.py", "FLASK_ENV": "development"}

    print("  🌱  Seeding database …")
    result = subprocess.run(
        [sys.executable, "seed.py"],
        cwd=str(project_dir),
        env=env,
        capture_output=False,  # let seed.py print its own progress
        text=True,
    )
    if result.returncode != 0:
        fail(
            "seed.py exited with an error.\n"
            "       Check the output above for details."
        )

    ok("Sample data inserted successfully")


# ---------------------------------------------------------------------------
# STEP 5 — Verify the setup
# ---------------------------------------------------------------------------

def verify_setup(user, password, host, port, dbname):
    section("STEP 5 — Verifying database setup")

    import pymysql

    try:
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=dbname,
            connect_timeout=10,
        )
    except pymysql.err.OperationalError as exc:
        fail(f"Cannot connect to '{dbname}' for verification: {exc}")

    # Tables we expect to exist (mapped to friendly display names)
    expected_tables = {
        "users":         "users",
        "hostels":       "hostels",
        "rooms":         "rooms",
        "hostel_images": "hostel_images",
        "reviews":       "reviews",
    }

    with conn.cursor() as cur:
        cur.execute("SHOW TABLES;")
        existing_tables = {row[0].lower() for row in cur.fetchall()}

        print(f"\n  {'TABLE':<20} {'ROWS':>6}")
        print(f"  {'─'*20} {'─'*6}")

        all_ok = True
        for table, label in expected_tables.items():
            if table in existing_tables:
                cur.execute(f"SELECT COUNT(*) FROM `{table}`;")
                count = cur.fetchone()[0]
                print(f"  ✅  {label:<18} : {count:>4} rows")
            else:
                print(f"  ⚠️   {label:<18} : NOT FOUND")
                all_ok = False

    conn.close()

    if not all_ok:
        print(
            "\n  ⚠️   Some tables are missing. "
            "Check the migration output above."
        )
    else:
        print()
        ok("All expected tables are present")


# ---------------------------------------------------------------------------
# STEP 6 — Final message
# ---------------------------------------------------------------------------

def final_message():
    print()
    print("=" * 48)
    print("  🎉  NESTORA DATABASE IS READY!")
    print("=" * 48)
    print()
    print("  Next steps:")
    print("    • Run:  python test_api.py   — to verify all APIs")
    print("    • Run:  python run.py        — to start the Flask server")
    print()
    print("  Sample credentials seeded:")
    print("    owner1@test.com / Test@1234")
    print("    owner2@test.com / Test@1234")
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    banner()

    user, password, host, port, dbname = load_env()
    create_database(user, password, host, port, dbname)
    run_migrations()
    run_seed()
    verify_setup(user, password, host, port, dbname)
    final_message()


if __name__ == "__main__":
    main()
