"""
seed.py — Populate the database with sample data for development/testing.

Usage:
    python seed.py
"""
import os
import sys

# Ensure the project root is on the path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.hostel import Hostel
from app.models.room import Room
from app.models.image import HostelImage
from app.models.review import Review
from werkzeug.security import generate_password_hash

app = create_app("development")


def clear_data():
    """Wipe all rows in dependency order."""
    print("🗑  Clearing existing seed data …")
    Review.query.delete()
    HostelImage.query.delete()
    Room.query.delete()
    Hostel.query.delete()
    User.query.filter(User.email.in_(["owner1@test.com", "owner2@test.com"])).delete(
        synchronize_session=False
    )
    db.session.commit()


def seed_users():
    """Create 2 owner accounts."""
    print("👤  Seeding users …")
    users = [
        User(
            name="Ravi Kumar",
            email="owner1@test.com",
            password_hash=generate_password_hash("Test@1234"),
            role="owner",
            phone="9876543210",
        ),
        User(
            name="Priya Sharma",
            email="owner2@test.com",
            password_hash=generate_password_hash("Test@1234"),
            role="owner",
            phone="9123456780",
        ),
    ]
    db.session.add_all(users)
    db.session.commit()
    print(f"   ✓ Created {len(users)} users.")
    return users


def seed_hostels(users):
    """Create 5 hostel listings across Bangalore and Mysore."""
    print("🏠  Seeding hostels …")
    owner1, owner2 = users[0], users[1]

    hostels = [
        Hostel(
            owner_id=owner1.user_id,
            hostel_name="Sri Sai Boys PG",
            description=(
                "Comfortable boys PG in the heart of Rajajinagar. "
                "Includes meals, Wi-Fi, laundry, and 24/7 security."
            ),
            city="Bangalore",
            area="Rajajinagar",
            address="No. 12, 3rd Cross, Rajajinagar, Bangalore - 560010",
            contact_phone="9876543210",
            gender="male",
            is_active=True,
        ),
        Hostel(
            owner_id=owner1.user_id,
            hostel_name="Green Leaf Co-Ed Hostel",
            description=(
                "Modern co-ed hostel near Koramangala tech corridor. "
                "AC rooms, power backup, gymnasium, and rooftop lounge."
            ),
            city="Bangalore",
            area="Koramangala",
            address="47, 5th Block, Koramangala, Bangalore - 560095",
            contact_phone="9876543210",
            gender="co-ed",
            is_active=True,
        ),
        Hostel(
            owner_id=owner1.user_id,
            hostel_name="Serenity Girls PG",
            description=(
                "Premium girls-only PG in Indiranagar. "
                "All meals, housekeeping, and CCTV security included."
            ),
            city="Bangalore",
            area="Indiranagar",
            address="8, 100 Feet Road, Indiranagar, Bangalore - 560038",
            contact_phone="9876543210",
            gender="female",
            is_active=True,
        ),
        Hostel(
            owner_id=owner2.user_id,
            hostel_name="Mysore Central Boys PG",
            description=(
                "Affordable boys PG near Mysore Palace. "
                "Veg meals, inverter backup, and library study room."
            ),
            city="Mysore",
            area="Nazarbad",
            address="23, Nazarbad Main Road, Mysore - 570010",
            contact_phone="9123456780",
            gender="male",
            is_active=True,
        ),
        Hostel(
            owner_id=owner2.user_id,
            hostel_name="Heritage Stay Co-Ed PG",
            description=(
                "Spacious co-ed PG in Mysore's IT zone. "
                "Furnished rooms, Netflix common room, and fast fibre internet."
            ),
            city="Mysore",
            area="Hebbal",
            address="Plot 5, Hebbal Industrial Area, Mysore - 570016",
            contact_phone="9123456780",
            gender="co-ed",
            is_active=True,
        ),
    ]
    db.session.add_all(hostels)
    db.session.commit()
    print(f"   ✓ Created {len(hostels)} hostels.")
    return hostels


def seed_rooms(hostels):
    """Add 2-3 room types to each hostel."""
    print("🛏  Seeding rooms …")
    rooms = []

    room_plans = [
        # hostel_id (index), room_type, rent, capacity, available_beds
        (0, "single", 6000.00, 1, 3),
        (0, "double", 4500.00, 2, 4),
        (0, "triple", 3500.00, 3, 6),

        (1, "single", 9000.00, 1, 2),
        (1, "double", 7000.00, 2, 5),
        (1, "triple", 5500.00, 3, 9),

        (2, "single", 8500.00, 1, 1),
        (2, "double", 6500.00, 2, 3),

        (3, "single", 4500.00, 1, 5),
        (3, "double", 3500.00, 2, 8),
        (3, "triple", 2800.00, 3, 12),

        (4, "single", 5500.00, 1, 4),
        (4, "double", 4200.00, 2, 6),
    ]

    for idx, rtype, rent, cap, beds in room_plans:
        rooms.append(
            Room(
                hostel_id=hostels[idx].hostel_id,
                room_type=rtype,
                rent=rent,
                capacity=cap,
                available_beds=beds,
            )
        )

    db.session.add_all(rooms)
    db.session.commit()
    print(f"   ✓ Created {len(rooms)} rooms.")


def seed_images(hostels):
    """Add 2-3 placeholder images per hostel."""
    print("🖼  Seeding images …")
    images = []

    placeholder_sets = [
        # (hostel index, list of image URLs)
        (
            0,
            [
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
            ],
        ),
        (
            1,
            [
                "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
                "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800",
            ],
        ),
        (
            2,
            [
                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
            ],
        ),
        (
            3,
            [
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
            ],
        ),
        (
            4,
            [
                "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=800",
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
                "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
            ],
        ),
    ]

    for hostel_idx, urls in placeholder_sets:
        for i, url in enumerate(urls):
            images.append(
                HostelImage(
                    hostel_id=hostels[hostel_idx].hostel_id,
                    image_url=url,
                    is_primary=(i == 0),  # first image is primary
                )
            )

    db.session.add_all(images)
    db.session.commit()
    print(f"   ✓ Created {len(images)} images.")


def seed_reviews(hostels):
    """Add 5-6 reviews spread across hostels."""
    print("⭐  Seeding reviews …")
    reviews_data = [
        (0, "Arun Patel", 5, "Excellent place! Clean rooms, great food, very safe."),
        (0, "Deepak Nair", 4, "Good value for money. Staff is friendly and helpful."),
        (1, "Sneha Rao", 5, "Amazing hostel. The rooftop lounge is a big plus!"),
        (1, "Karan Mehta", 3, "Decent place but Wi-Fi speed could be improved."),
        (2, "Ananya Singh", 5, "Best girls PG in Indiranagar. Highly recommended!"),
        (3, "Vijay Kumar", 4, "Very affordable and clean. Library is a great addition."),
        (4, "Lakshmi Devi", 4, "Great co-ed PG. Netflix room and fast internet are highlights."),
    ]

    reviews = []
    for hostel_idx, reviewer, rating, comment in reviews_data:
        reviews.append(
            Review(
                hostel_id=hostels[hostel_idx].hostel_id,
                reviewer_name=reviewer,
                rating=rating,
                comment=comment,
            )
        )

    db.session.add_all(reviews)
    db.session.commit()
    print(f"   ✓ Created {len(reviews)} reviews.")


def main():
    with app.app_context():
        clear_data()
        users = seed_users()
        hostels = seed_hostels(users)
        seed_rooms(hostels)
        seed_images(hostels)
        seed_reviews(hostels)
        print("\n✅  Database seeded successfully!")
        print("   owner1@test.com / Test@1234")
        print("   owner2@test.com / Test@1234")


if __name__ == "__main__":
    main()
