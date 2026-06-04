"""
test_api.py — Nestora Backend API Test Suite
=============================================
Runs every endpoint in order, prints PASS/FAIL per test,
and prints a summary table at the end.

Usage:
    pip install requests
    python test_api.py
"""

import sys
import json
import requests

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
BASE_URL = "http://localhost:5000"
TIMEOUT  = 10          # seconds per request

OWNER1_EMAIL    = "owner1@test.com"
OWNER1_PASSWORD = "Test@1234"

TEST_OWNER_EMAIL    = "testowner_qa@test.com"   # unique to avoid duplicate on re-runs
TEST_OWNER_PASSWORD = "Test@1234"

# ─────────────────────────────────────────────
# State shared across tests
# ─────────────────────────────────────────────
state = {
    "token":      None,   # JWT Bearer token
    "hostel_id":  None,   # created during tests
    "room_id":    None,   # created during tests
    "review_id":  None,   # created during tests
}

results = []   # list of (section, name, passed, note)

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
CYAN    = "\033[96m"
GREEN   = "\033[92m"
RED     = "\033[91m"
YELLOW  = "\033[93m"
RESET   = "\033[0m"
BOLD    = "\033[1m"

def _auth_headers():
    if state["token"]:
        return {"Authorization": f"Bearer {state['token']}"}
    return {}


def _json(resp):
    try:
        return resp.json()
    except Exception:
        return {"raw": resp.text[:300]}


def check(
    section: str,
    name: str,
    resp: requests.Response,
    expected_status: int,
    *,
    expect_success: bool = True,
    save_key: str = None,
    save_path: list = None,
):
    """
    Evaluate one HTTP response.

    :param section:        Section header (e.g. 'AUTH')
    :param name:           Human-readable test name
    :param resp:           requests.Response object
    :param expected_status: HTTP status code we expect
    :param expect_success:  Whether data.success should be True
    :param save_key:        Key in `state` to save a value to
    :param save_path:       JSON path (list) to the value to save
    """
    body = _json(resp)
    status_ok = resp.status_code == expected_status

    success_ok = True
    if expect_success is not None:
        actual_success = body.get("success", None)
        if actual_success is not None:
            success_ok = (actual_success == expect_success)

    passed = status_ok and success_ok

    # Save a value from the response into shared state
    if passed and save_key and save_path:
        try:
            val = body
            for key in save_path:
                val = val[key]
            state[save_key] = val
        except (KeyError, TypeError):
            passed = False
            note = f"Could not extract {'.'.join(str(k) for k in save_path)} from response"
            results.append((section, name, False, note))
            _print_result(section, name, False, resp, expected_status, note)
            return

    note = ""
    results.append((section, name, passed, note))
    _print_result(section, name, passed, resp, expected_status, note)


def _print_result(section, name, passed, resp, expected_status, note=""):
    icon = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"  {icon} — {name}")
    if not passed:
        body = _json(resp)
        print(f"       {YELLOW}Expected: {expected_status} | Got: {resp.status_code}{RESET}")
        print(f"       Response: {json.dumps(body, indent=2)[:400]}")
        if note:
            print(f"       Note: {note}")


def section_header(title: str):
    print(f"\n{BOLD}{CYAN}[{title}]{RESET}")


def server_check():
    """Exit early with a clear message if Flask is not running."""
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
        assert r.status_code == 200
    except Exception:
        print(f"\n{RED}╔══════════════════════════════════════╗")
        print( "║   ERROR: Flask server is NOT running ║")
        print( "╚══════════════════════════════════════╝")
        print( f"  Start it with:  python run.py{RESET}\n")
        sys.exit(1)


# ─────────────────────────────────────────────
# Test groups
# ─────────────────────────────────────────────

def test_health():
    section_header("HEALTH CHECK")
    r = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
    check("HEALTH", "Health Check → 200 + status ok",
          r, 200, expect_success=True)


# ── AUTH ─────────────────────────────────────

def test_auth():
    section_header("AUTH")

    # 1. Register new owner (may get 409 on re-run — that's OK, treat 201 or 409 as pass)
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test QA Owner",
        "email": TEST_OWNER_EMAIL,
        "password": TEST_OWNER_PASSWORD,
        "role": "owner",
    }, timeout=TIMEOUT)
    body = _json(r)
    passed = r.status_code in (201, 409)   # 409 = already exists from prev run
    note = "(409 = already registered, acceptable on re-run)" if r.status_code == 409 else ""
    results.append(("AUTH", "Register new owner", passed, note))
    icon = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"  {icon} — Register new owner{(' ' + YELLOW + note + RESET) if note else ''}")
    if not passed:
        print(f"       Expected: 201 | Got: {r.status_code}")
        print(f"       Response: {json.dumps(body)[:300]}")

    # 2. Login with valid credentials — save token
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": OWNER1_EMAIL,
        "password": OWNER1_PASSWORD,
    }, timeout=TIMEOUT)
    check("AUTH", "Login with valid credentials",
          r, 200,
          save_key="token",
          save_path=["data", "access_token"])

    # 3. Wrong password → 401
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": OWNER1_EMAIL,
        "password": "wrongpassword",
    }, timeout=TIMEOUT)
    check("AUTH", "Login with wrong password → 401",
          r, 401, expect_success=False)

    # 4. GET /profile with token → 200
    r = requests.get(f"{BASE_URL}/api/auth/profile",
                     headers=_auth_headers(), timeout=TIMEOUT)
    check("AUTH", "GET /profile with valid token",
          r, 200, expect_success=True)

    # 5. GET /profile without token → 401
    r = requests.get(f"{BASE_URL}/api/auth/profile", timeout=TIMEOUT)
    check("AUTH", "GET /profile without token → 401",
          r, 401, expect_success=False)

    # 6. PUT /profile — update name
    r = requests.put(f"{BASE_URL}/api/auth/profile",
                     headers=_auth_headers(),
                     json={"name": "Ravi Kumar (Updated)"},
                     timeout=TIMEOUT)
    check("AUTH", "PUT /profile — update name",
          r, 200, expect_success=True)


# ── HOSTELS ──────────────────────────────────

def test_hostels():
    section_header("HOSTELS")

    # 1. GET all hostels (public)
    r = requests.get(f"{BASE_URL}/api/hostels", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels — list all (public)",
          r, 200, expect_success=True)

    # 2. Filter by city
    r = requests.get(f"{BASE_URL}/api/hostels?city=Bangalore", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?city=Bangalore",
          r, 200, expect_success=True)

    # 3. Filter by rent range
    r = requests.get(f"{BASE_URL}/api/hostels?min_rent=3000&max_rent=7000", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?min_rent=3000&max_rent=7000",
          r, 200, expect_success=True)

    # 4. Search
    r = requests.get(f"{BASE_URL}/api/hostels?search=sai", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?search=sai",
          r, 200, expect_success=True)

    # 5. Filter by room_type
    r = requests.get(f"{BASE_URL}/api/hostels?room_type=single", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?room_type=single",
          r, 200, expect_success=True)

    # 6. Filter by gender
    r = requests.get(f"{BASE_URL}/api/hostels?gender=male", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?gender=male",
          r, 200, expect_success=True)

    # 7. Filter: available beds
    r = requests.get(f"{BASE_URL}/api/hostels?available=true", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?available=true",
          r, 200, expect_success=True)

    # 8. Pagination
    r = requests.get(f"{BASE_URL}/api/hostels?page=1&per_page=2", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels?page=1&per_page=2 — pagination",
          r, 200, expect_success=True)

    # 9. POST — create hostel [owner] → save hostel_id
    r = requests.post(f"{BASE_URL}/api/hostels",
                      headers=_auth_headers(),
                      json={
                          "hostel_name": "Test PG (QA)",
                          "description": "A test PG created by the API test suite",
                          "city": "Bangalore",
                          "area": "Koramangala",
                          "address": "123 Test Street, 5th Block, Koramangala",
                          "contact_phone": "9876543210",
                          "gender": "male",
                      },
                      timeout=TIMEOUT)
    check("HOSTELS", "POST /hostels — create hostel",
          r, 201, expect_success=True,
          save_key="hostel_id",
          save_path=["data", "hostel", "hostel_id"])

    # 10. GET single hostel detail
    if state["hostel_id"]:
        r = requests.get(f"{BASE_URL}/api/hostels/{state['hostel_id']}", timeout=TIMEOUT)
        check("HOSTELS", f"GET /hostels/{state['hostel_id']} — full detail",
              r, 200, expect_success=True)

        # Verify required fields exist in response
        body = _json(r)
        hostel = body.get("data", {}).get("hostel", {})
        required_fields = ["hostel_id", "hostel_name", "owner", "rooms", "images", "reviews", "rent_range"]
        has_all = all(f in hostel for f in required_fields)
        results.append(("HOSTELS", "Hostel detail has all required fields", has_all, ""))
        icon = f"{GREEN}✅ PASS{RESET}" if has_all else f"{RED}❌ FAIL{RESET}"
        print(f"  {icon} — Hostel detail has all required fields")
        if not has_all:
            missing = [f for f in required_fields if f not in hostel]
            print(f"       Missing fields: {missing}")
    else:
        results.append(("HOSTELS", "GET /hostels/<id> — full detail", False, "hostel_id not saved"))
        print(f"  {RED}❌ FAIL{RESET} — GET hostel detail (hostel_id not available)")

    # 11. GET non-existent hostel → 404
    r = requests.get(f"{BASE_URL}/api/hostels/99999", timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels/99999 — non-existent → 404",
          r, 404, expect_success=False)

    # 12. PUT update hostel [owner]
    if state["hostel_id"]:
        r = requests.put(f"{BASE_URL}/api/hostels/{state['hostel_id']}",
                         headers=_auth_headers(),
                         json={"description": "Updated by QA test suite"},
                         timeout=TIMEOUT)
        check("HOSTELS", "PUT /hostels/<id> — update description",
              r, 200, expect_success=True)

    # 13. PUT without token → 401
    if state["hostel_id"]:
        r = requests.put(f"{BASE_URL}/api/hostels/{state['hostel_id']}",
                         json={"description": "Should fail"},
                         timeout=TIMEOUT)
        check("HOSTELS", "PUT /hostels/<id> without token → 401",
              r, 401, expect_success=False)

    # 14. GET /hostels/my — owner's own listings
    r = requests.get(f"{BASE_URL}/api/hostels/my",
                     headers=_auth_headers(), timeout=TIMEOUT)
    check("HOSTELS", "GET /hostels/my — owner's listings",
          r, 200, expect_success=True)


# ── ROOMS ────────────────────────────────────

def test_rooms():
    section_header("ROOMS")

    if not state["hostel_id"]:
        print(f"  {YELLOW}⚠ SKIP — hostel_id not available, skipping room tests{RESET}")
        return

    hid = state["hostel_id"]

    # 1. POST add single room → save room_id
    r = requests.post(f"{BASE_URL}/api/rooms/hostel/{hid}",
                      headers=_auth_headers(),
                      json={"room_type": "single", "rent": 6000,
                            "capacity": 1, "available_beds": 3},
                      timeout=TIMEOUT)
    check("ROOMS", "POST /rooms/hostel/<id> — add single room",
          r, 201, expect_success=True,
          save_key="room_id",
          save_path=["data", "room", "room_id"])

    # 2. POST add double room
    r = requests.post(f"{BASE_URL}/api/rooms/hostel/{hid}",
                      headers=_auth_headers(),
                      json={"room_type": "double", "rent": 4500,
                            "capacity": 2, "available_beds": 1},
                      timeout=TIMEOUT)
    check("ROOMS", "POST /rooms/hostel/<id> — add double room",
          r, 201, expect_success=True)

    # 3. POST add triple room
    r = requests.post(f"{BASE_URL}/api/rooms/hostel/{hid}",
                      headers=_auth_headers(),
                      json={"room_type": "triple", "rent": 3200,
                            "capacity": 3, "available_beds": 5},
                      timeout=TIMEOUT)
    check("ROOMS", "POST /rooms/hostel/<id> — add triple room",
          r, 201, expect_success=True)

    # 4. Invalid room_type → 400
    r = requests.post(f"{BASE_URL}/api/rooms/hostel/{hid}",
                      headers=_auth_headers(),
                      json={"room_type": "penthouse", "rent": 50000,
                            "capacity": 1, "available_beds": 1},
                      timeout=TIMEOUT)
    check("ROOMS", "POST invalid room_type → 400",
          r, 400, expect_success=False)

    # 5. GET rooms for hostel (public)
    r = requests.get(f"{BASE_URL}/api/rooms/hostel/{hid}", timeout=TIMEOUT)
    check("ROOMS", "GET /rooms/hostel/<id> — list rooms",
          r, 200, expect_success=True)

    # Verify we got rooms back
    body = _json(r)
    room_count = len(body.get("data", {}).get("rooms", []))
    has_rooms = room_count >= 2
    results.append(("ROOMS", f"GET rooms returns ≥2 rooms (got {room_count})", has_rooms, ""))
    icon = f"{GREEN}✅ PASS{RESET}" if has_rooms else f"{RED}❌ FAIL{RESET}"
    print(f"  {icon} — GET rooms returns ≥2 rooms (got {room_count})")

    # 6. PUT update room
    if state["room_id"]:
        r = requests.put(f"{BASE_URL}/api/rooms/{state['room_id']}",
                         headers=_auth_headers(),
                         json={"available_beds": 5, "rent": 6500},
                         timeout=TIMEOUT)
        check("ROOMS", "PUT /rooms/<id> — update availability & rent",
              r, 200, expect_success=True)

    # 7. DELETE room without token → 401
    if state["room_id"]:
        r = requests.delete(f"{BASE_URL}/api/rooms/{state['room_id']}",
                            timeout=TIMEOUT)
        check("ROOMS", "DELETE /rooms/<id> without token → 401",
              r, 401, expect_success=False)

    # 8. GET non-existent hostel rooms → 404
    r = requests.get(f"{BASE_URL}/api/rooms/hostel/99999", timeout=TIMEOUT)
    check("ROOMS", "GET /rooms/hostel/99999 — non-existent → 404",
          r, 404, expect_success=False)


# ── IMAGES ───────────────────────────────────

def test_images():
    section_header("IMAGES")

    if not state["hostel_id"]:
        print(f"  {YELLOW}⚠ SKIP — hostel_id not available{RESET}")
        return

    hid = state["hostel_id"]

    # 1. Upload without token → 401
    r = requests.post(f"{BASE_URL}/api/images/hostel/{hid}",
                      timeout=TIMEOUT)
    check("IMAGES", "POST /images/hostel/<id> without token → 401",
          r, 401, expect_success=False)

    # 2. Upload with no file → 400
    r = requests.post(f"{BASE_URL}/api/images/hostel/{hid}",
                      headers=_auth_headers(),
                      timeout=TIMEOUT)
    check("IMAGES", "POST /images with no file attached → 400",
          r, 400, expect_success=False)

    # 3. Upload a valid PNG via multipart
    import io
    # Minimal 1×1 white PNG (valid file)
    png_bytes = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
        b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
        b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    r = requests.post(
        f"{BASE_URL}/api/images/hostel/{hid}",
        headers=_auth_headers(),
        files={"images": ("test_image.png", io.BytesIO(png_bytes), "image/png")},
        timeout=TIMEOUT,
    )
    check("IMAGES", "POST /images/hostel/<id> — upload PNG",
          r, 201, expect_success=True)

    # Save image_id for later tests
    body = _json(r)
    try:
        image_id = body["data"]["uploaded"][0]["image_id"]
        state["image_id"] = image_id
    except (KeyError, IndexError):
        state["image_id"] = None

    # 4. Set primary image
    if state.get("image_id"):
        r = requests.put(
            f"{BASE_URL}/api/images/{state['image_id']}/primary",
            headers=_auth_headers(),
            timeout=TIMEOUT,
        )
        check("IMAGES", "PUT /images/<id>/primary — set primary",
              r, 200, expect_success=True)

    # 5. DELETE image without token → 401
    if state.get("image_id"):
        r = requests.delete(
            f"{BASE_URL}/api/images/{state['image_id']}",
            timeout=TIMEOUT,
        )
        check("IMAGES", "DELETE /images/<id> without token → 401",
              r, 401, expect_success=False)

    # 6. DELETE image with valid token
    if state.get("image_id"):
        r = requests.delete(
            f"{BASE_URL}/api/images/{state['image_id']}",
            headers=_auth_headers(),
            timeout=TIMEOUT,
        )
        check("IMAGES", "DELETE /images/<id> with token → 200",
              r, 200, expect_success=True)

    # 7. DELETE non-existent image → 404
    r = requests.delete(
        f"{BASE_URL}/api/images/99999",
        headers=_auth_headers(),
        timeout=TIMEOUT,
    )
    check("IMAGES", "DELETE /images/99999 — non-existent → 404",
          r, 404, expect_success=False)


# ── REVIEWS ──────────────────────────────────

def test_reviews():
    section_header("REVIEWS")

    if not state["hostel_id"]:
        print(f"  {YELLOW}⚠ SKIP — hostel_id not available{RESET}")
        return

    hid = state["hostel_id"]

    # 1. POST review (no auth needed)
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"reviewer_name": "Gagan", "rating": 5,
                            "comment": "Excellent PG! Really well maintained."},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — Gagan rating 5",
          r, 201, expect_success=True,
          save_key="review_id",
          save_path=["data", "review", "review_id"])

    # 2. Second review
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"reviewer_name": "Krupaal", "rating": 4,
                            "comment": "Good place to stay, very clean."},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — Krupaal rating 4",
          r, 201, expect_success=True)

    # 3. Third review — rating 3
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"reviewer_name": "Meera", "rating": 3,
                            "comment": "Average but affordable."},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — Meera rating 3",
          r, 201, expect_success=True)

    # 4. Invalid rating (> 5) → 400
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"reviewer_name": "Bad Actor", "rating": 6},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — rating=6 (invalid) → 400",
          r, 400, expect_success=False)

    # 5. Invalid rating (< 1) → 400
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"reviewer_name": "Bad Actor", "rating": 0},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — rating=0 (invalid) → 400",
          r, 400, expect_success=False)

    # 6. Missing reviewer_name → 400
    r = requests.post(f"{BASE_URL}/api/reviews/hostel/{hid}",
                      json={"rating": 3},
                      timeout=TIMEOUT)
    check("REVIEWS", "POST /reviews — missing reviewer_name → 400",
          r, 400, expect_success=False)

    # 7. GET all reviews for hostel
    r = requests.get(f"{BASE_URL}/api/reviews/hostel/{hid}", timeout=TIMEOUT)
    check("REVIEWS", "GET /reviews/hostel/<id> — list reviews",
          r, 200, expect_success=True)

    body = _json(r)
    review_count = len(body.get("data", {}).get("reviews", []))
    has_reviews = review_count >= 3
    results.append(("REVIEWS", f"Reviews list has ≥3 entries (got {review_count})", has_reviews, ""))
    icon = f"{GREEN}✅ PASS{RESET}" if has_reviews else f"{RED}❌ FAIL{RESET}"
    print(f"  {icon} — Reviews list has ≥3 entries (got {review_count})")

    # 8. GET reviews for non-existent hostel → 404
    r = requests.get(f"{BASE_URL}/api/reviews/hostel/99999", timeout=TIMEOUT)
    check("REVIEWS", "GET /reviews for non-existent hostel → 404",
          r, 404, expect_success=False)

    # 9. DELETE review without admin token → 403
    if state.get("review_id"):
        r = requests.delete(
            f"{BASE_URL}/api/reviews/{state['review_id']}",
            headers=_auth_headers(),   # owner token, not admin
            timeout=TIMEOUT,
        )
        check("REVIEWS", "DELETE /reviews/<id> with owner token → 403",
              r, 403, expect_success=False)

    # 10. DELETE review without any token → 401
    if state.get("review_id"):
        r = requests.delete(
            f"{BASE_URL}/api/reviews/{state['review_id']}",
            timeout=TIMEOUT,
        )
        check("REVIEWS", "DELETE /reviews/<id> without token → 401",
              r, 401, expect_success=False)


# ── CROSS-OWNER SECURITY ─────────────────────

def test_security():
    section_header("SECURITY (cross-owner access)")

    if not state["hostel_id"]:
        print(f"  {YELLOW}⚠ SKIP — hostel_id not available{RESET}")
        return

    # Login as owner2 and try to modify owner1's hostel
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": "owner2@test.com", "password": "Test@1234"},
                      timeout=TIMEOUT)
    body = _json(r)
    owner2_token = None
    if r.status_code == 200:
        try:
            owner2_token = body["data"]["access_token"]
        except KeyError:
            pass

    if not owner2_token:
        results.append(("SECURITY", "Login as owner2", False, "Could not get owner2 token"))
        print(f"  {RED}❌ FAIL{RESET} — Login as owner2 (needed for cross-owner tests)")
        return

    headers2 = {"Authorization": f"Bearer {owner2_token}"}

    # owner2 tries to update owner1's hostel → 403
    r = requests.put(
        f"{BASE_URL}/api/hostels/{state['hostel_id']}",
        headers=headers2,
        json={"description": "Hijacked!"},
        timeout=TIMEOUT,
    )
    check("SECURITY", "owner2 PUT on owner1's hostel → 403",
          r, 403, expect_success=False)

    # owner2 tries to delete owner1's hostel → 403
    r = requests.delete(
        f"{BASE_URL}/api/hostels/{state['hostel_id']}",
        headers=headers2,
        timeout=TIMEOUT,
    )
    check("SECURITY", "owner2 DELETE on owner1's hostel → 403",
          r, 403, expect_success=False)

    # owner2 tries to add room to owner1's hostel → 403
    r = requests.post(
        f"{BASE_URL}/api/rooms/hostel/{state['hostel_id']}",
        headers=headers2,
        json={"room_type": "single", "rent": 999, "capacity": 1, "available_beds": 1},
        timeout=TIMEOUT,
    )
    check("SECURITY", "owner2 POST room on owner1's hostel → 403",
          r, 403, expect_success=False)


# ── CLEANUP ──────────────────────────────────

def test_cleanup():
    section_header("CLEANUP")

    if not state["hostel_id"]:
        print(f"  {YELLOW}⚠ SKIP — hostel_id not available{RESET}")
        return

    hid = state["hostel_id"]

    # 1. DELETE hostel [owner]
    r = requests.delete(f"{BASE_URL}/api/hostels/{hid}",
                        headers=_auth_headers(), timeout=TIMEOUT)
    check("CLEANUP", "DELETE /hostels/<id> — delete own hostel",
          r, 200, expect_success=True)

    # 2. Confirm hostel is gone → 404
    r = requests.get(f"{BASE_URL}/api/hostels/{hid}", timeout=TIMEOUT)
    check("CLEANUP", f"GET /hostels/{hid} after delete → 404",
          r, 404, expect_success=False)

    # 3. Confirm rooms are gone (cascade) → 404
    r = requests.get(f"{BASE_URL}/api/rooms/hostel/{hid}", timeout=TIMEOUT)
    check("CLEANUP", f"GET /rooms/hostel/{hid} after hostel delete → 404",
          r, 404, expect_success=False)

    # 4. Logout
    r = requests.post(f"{BASE_URL}/api/auth/logout",
                      headers=_auth_headers(), timeout=TIMEOUT)
    check("CLEANUP", "POST /auth/logout",
          r, 200, expect_success=True)


# ─────────────────────────────────────────────
# Summary printer
# ─────────────────────────────────────────────

def print_summary():
    total  = len(results)
    passed = sum(1 for _, _, ok, _ in results if ok)
    failed = total - passed

    print(f"\n{BOLD}{'═' * 54}")
    colour = GREEN if failed == 0 else RED
    print(f"RESULTS: {colour}{passed} passed{RESET} | "
          f"{(RED if failed else GREEN)}{failed} failed{RESET} | "
          f"{total} total")
    print(f"{BOLD}{'═' * 54}{RESET}\n")

    # Summary table
    print(f"{BOLD}{'SECTION':<12} {'TEST NAME':<50} {'STATUS'}{RESET}")
    print("─" * 72)
    for section, name, ok, note in results:
        status = f"{GREEN}PASS{RESET}" if ok else f"{RED}FAIL{RESET}"
        note_str = f"  ({note})" if note else ""
        truncated = (name[:47] + "...") if len(name) > 50 else name
        print(f"{section:<12} {truncated:<50} {status}{note_str}")

    print()
    if failed == 0:
        print(f"{GREEN}{BOLD}🎉  All tests passed! Nestora backend is fully functional.{RESET}")
    else:
        print(f"{RED}{BOLD}⚠   {failed} test(s) failed. See details above.{RESET}")
    print()


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════╗")
    print(        "║       NESTORA API TEST SUITE v1.0        ║")
    print(        f"╚══════════════════════════════════════════╝{RESET}")
    print(f"  Base URL : {BASE_URL}")
    print(f"  Timeout  : {TIMEOUT}s per request\n")

    # Gate: abort if server offline
    server_check()
    print(f"  {GREEN}Server is running ✔{RESET}\n")

    try:
        test_health()
        test_auth()
        test_hostels()
        test_rooms()
        test_images()
        test_reviews()
        test_security()
        test_cleanup()
    except requests.exceptions.ConnectionError:
        print(f"\n{RED}Lost connection to Flask server. Is it still running?{RESET}")
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test run interrupted by user.{RESET}")
    finally:
        print_summary()


if __name__ == "__main__":
    main()
