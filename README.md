# Nestora Backend API

A complete Flask REST API backend for **Nestora** — a PG & Hostel Finder platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Flask 3.0 |
| ORM | SQLAlchemy 2.0 + Flask-SQLAlchemy |
| Database | MySQL (via PyMySQL) |
| Auth | Flask-JWT-Extended (Bearer tokens) |
| Migrations | Flask-Migrate (Alembic) |
| CORS | Flask-CORS |
| File Uploads | Werkzeug + Pillow |
| Config | python-dotenv |

---

## Project Structure

```
nestora-backend/
├── app/
│   ├── __init__.py          # Flask app factory (create_app)
│   ├── config.py            # Config classes from .env
│   ├── extensions.py        # db, jwt, cors, migrate singletons
│   ├── models/
│   │   ├── __init__.py      # Re-exports all models
│   │   ├── user.py          # User model
│   │   ├── hostel.py        # Hostel model
│   │   ├── room.py          # Room model
│   │   ├── image.py         # HostelImage model
│   │   └── review.py        # Review model
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py          # /api/auth/*
│   │   ├── hostels.py       # /api/hostels/*
│   │   ├── rooms.py         # /api/rooms/*
│   │   ├── images.py        # /api/images/*
│   │   └── reviews.py       # /api/reviews/*
│   └── utils/
│       ├── __init__.py
│       └── helpers.py       # File upload, pagination, response, decorators
├── uploads/                 # Auto-created local image storage
├── migrations/              # Flask-Migrate generated
├── .env                     # Local secrets (not committed)
├── .env.example             # Template for .env
├── requirements.txt
├── seed.py                  # Sample data loader
└── run.py                   # Entry point
```

---

## Setup & Installation

### 1. Prerequisites

- Python 3.11+
- MySQL 8.0+
- pip

### 2. Clone & Install

```bash
cd nestora-backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Create the MySQL Database

```sql
CREATE DATABASE nestora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY
```

Key variables in `.env`:

```ini
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/nestora_db
SECRET_KEY=nestora-super-secret-key-change-in-prod
JWT_SECRET_KEY=nestora-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=5242880
```

### 5. Run Migrations

```bash
flask db init        # Only needed first time
flask db migrate -m "Initial schema"
flask db upgrade
```

### 6. Seed Sample Data

```bash
python seed.py
```

Creates:
- `owner1@test.com` / `Test@1234`
- `owner2@test.com` / `Test@1234`
- 5 hostels (Bangalore + Mysore), rooms, images, reviews

### 7. Run the Server

```bash
python run.py
# OR
flask run
```

Server starts at: **http://localhost:5000**

---

## API Reference

> Base URL: `http://localhost:5000`
>
> Protected routes require: `Authorization: Bearer <token>`

### Health Check

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | None |

```json
{ "success": true, "data": { "status": "ok", "database": "connected" } }
```

---

### Auth  `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register owner |
| POST | `/api/auth/login` | None | Login, get JWT |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/auth/profile` | JWT | Get own profile |
| PUT | `/api/auth/profile` | JWT | Update profile |

**Register**
```json
POST /api/auth/register
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "password": "MyPass@123",
  "phone": "9876543210",
  "role": "owner"
}
```

**Login**
```json
POST /api/auth/login
{ "email": "owner1@test.com", "password": "Test@1234" }
```
Response:
```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "user": { "user_id": 1, "name": "Ravi Kumar", "role": "owner" }
  }
}
```

---

### Hostels  `/api/hostels`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/hostels` | None | List all (with filters) |
| GET | `/api/hostels/<id>` | None | Full hostel detail |
| POST | `/api/hostels` | Owner | Create hostel |
| PUT | `/api/hostels/<id>` | Owner | Update own hostel |
| DELETE | `/api/hostels/<id>` | Owner | Delete own hostel |
| GET | `/api/hostels/my` | JWT | Owner's own listings |

**Filters for GET `/api/hostels`**

| Param | Type | Example |
|-------|------|---------|
| `search` | string | `?search=sai` |
| `city` | string | `?city=Bangalore` |
| `area` | string | `?area=Koramangala` |
| `gender` | male/female/co-ed | `?gender=male` |
| `room_type` | single/double/triple | `?room_type=single` |
| `min_rent` | number | `?min_rent=3000` |
| `max_rent` | number | `?max_rent=8000` |
| `min_rating` | number | `?min_rating=4` |
| `available` | true/false | `?available=true` |
| `page` | int | `?page=2` |
| `per_page` | int (max 50) | `?per_page=12` |

**Create Hostel**
```json
POST /api/hostels
Authorization: Bearer <token>
{
  "hostel_name": "My PG",
  "description": "Nice place",
  "city": "Bangalore",
  "area": "HSR Layout",
  "address": "12, 3rd Sector, HSR Layout",
  "contact_phone": "9876543210",
  "gender": "co-ed"
}
```

---

### Rooms  `/api/rooms`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/rooms/hostel/<hostel_id>` | None | Get all rooms |
| POST | `/api/rooms/hostel/<hostel_id>` | Owner | Add room |
| PUT | `/api/rooms/<room_id>` | Owner | Update room |
| DELETE | `/api/rooms/<room_id>` | Owner | Delete room |

**Add Room**
```json
POST /api/rooms/hostel/1
Authorization: Bearer <token>
{
  "room_type": "double",
  "rent": 5500,
  "capacity": 2,
  "available_beds": 1
}
```

---

### Images  `/api/images`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/images/hostel/<hostel_id>` | Owner | Upload images |
| DELETE | `/api/images/<image_id>` | Owner | Delete image |
| PUT | `/api/images/<image_id>/primary` | Owner | Set primary |

**Upload Images** (multipart/form-data)
```
POST /api/images/hostel/1
Authorization: Bearer <token>
Content-Type: multipart/form-data

Key: images   Value: <file1>, <file2>
```

- Accepts: `jpg`, `jpeg`, `png`, `webp`
- Max file size: **5 MB** per image
- Max images per hostel: **10**
- Files saved to: `uploads/<hostel_id>/<uuid>.<ext>`
- Served at: `GET /uploads/<hostel_id>/<filename>`

---

### Reviews  `/api/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/hostel/<hostel_id>` | None | Get reviews |
| POST | `/api/reviews/hostel/<hostel_id>` | None | Post review |
| DELETE | `/api/reviews/<review_id>` | Admin | Delete review |

**Post Review** (no authentication required)
```json
POST /api/reviews/hostel/1
{
  "reviewer_name": "Ananya",
  "rating": 5,
  "comment": "Excellent PG! Very clean and well-managed."
}
```

---

## Response Format

**Success**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

**Error**
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": "reason" }
}
```

**HTTP Status Codes**

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (wrong owner/role) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 413 | Payload Too Large (file > 5 MB) |
| 500 | Internal Server Error |

---

## Authentication & Roles

| Role | Can Do |
|------|--------|
| `owner` | Create/edit/delete own hostels, rooms, images |
| `admin` | Delete any review |

JWT claims structure:
```json
{ "sub": "1", "role": "owner" }
```

Include token in every protected request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Migrations

```bash
# After changing any model
flask db migrate -m "Describe your change"
flask db upgrade

# Roll back one step
flask db downgrade
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | App environment |
| `FLASK_DEBUG` | `True` | Debug mode |
| `SECRET_KEY` | — | Flask session secret |
| `DATABASE_URL` | — | MySQL connection string |
| `JWT_SECRET_KEY` | — | JWT signing key |
| `JWT_ACCESS_TOKEN_EXPIRES` | `3600` | Token TTL in seconds |
| `UPLOAD_FOLDER` | `uploads` | Image storage directory |
| `MAX_CONTENT_LENGTH` | `5242880` | Max upload size (bytes) |

---

## Development Notes

- SQL queries are echoed to console in debug mode (`SQLALCHEMY_ECHO=True`)
- CORS is pre-configured for `http://localhost:5173` (Vite default)
- On hostel delete, all associated images are removed from disk automatically
- The first image uploaded for a hostel is auto-set as primary
- If the primary image is deleted, the next available image is promoted automatically
