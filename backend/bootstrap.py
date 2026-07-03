"""Bootstrap routes, roles, and additional API endpoints for SkyJet."""

from functools import wraps
from datetime import datetime

from flask import request, jsonify

from skyjet_data import (
    generate_routes,
    flight_type_for_route,
    parse_city_name,
    city_label,
    DOMESTIC_CITIES,
    INTERNATIONAL_CITIES,
    CITY_CODES,
)


ADMIN_EMAIL = "admin@skyjet.com"
ADMIN_PASSWORD = "admin123"


def ensure_bootstrap(db):
    """Seed routes, admin user, and backfill flight metadata."""
    if db.routes.count_documents({}) == 0:
        routes = generate_routes()
        db.routes.insert_many(routes)
        print(f"Seeded {len(routes)} routes.")

    if not db.users.find_one({"email": ADMIN_EMAIL}):
        db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "first_name": "SkyJet",
            "last_name": "Admin",
            "role": "admin",
        })
        print("Seeded admin user (admin@skyjet.com / admin123).")

    for flight in db.flights.find({"flightType": {"$exists": False}}):
        ft = flight_type_for_route(
            flight.get("origin", ""),
            flight.get("destination", ""),
        )
        db.flights.update_one(
            {"_id": flight["_id"]},
            {"$set": {"flightType": ft, "availableSeats": flight.get("seats_left", 0)}},
        )

    for user in db.users.find({"role": {"$exists": False}}):
        db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "customer"}})


def require_admin(db):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            email = request.headers.get("X-User-Email", "").strip().lower()
            if not email:
                data = request.get_json(silent=True) or {}
                email = (data.get("admin_email") or data.get("email") or "").strip().lower()
            user = db.users.find_one({"email": email}) if email else None
            if not user or user.get("role") != "admin":
                return jsonify({"error": "Admin access required."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def enrich_flight(flight):
    if not flight:
        return flight
    if "flightType" not in flight:
        flight["flightType"] = flight_type_for_route(
            flight.get("origin", ""),
            flight.get("destination", ""),
        )
    if "availableSeats" not in flight:
        flight["availableSeats"] = flight.get("seats_left", 0)
    return flight


def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def register_extensions(app, db, helpers):
    """Register routes and patch-dependent endpoints."""
    generate_reference = helpers["generate_reference"]
    log_notification = helpers["log_notification"]
    get_booking_details_extended = helpers["get_booking_details_extended"]
    get_occupied_seats = helpers["get_occupied_seats"]
    admin_required = require_admin(db)

    @app.route("/api/routes", methods=["GET"])
    def list_routes():
        origin = request.args.get("origin", "").strip()
        query = {}
        if origin:
            code = origin.upper()
            city = parse_city_name(origin)
            query["$or"] = [
                {"origin": {"$regex": origin, "$options": "i"}},
                {"origin_code": code},
                {"origin": city},
            ]
        routes = list(db.routes.find(query).sort("origin", 1))
        for r in routes:
            serialize_doc(r)
        return jsonify(routes)

    @app.route("/api/routes/origins", methods=["GET"])
    def route_origins():
        origins = db.routes.distinct("origin")
        result = sorted(
            [{"city": o, "code": CITY_CODES.get(o, o[:3].upper()), "label": city_label(o)} for o in origins],
            key=lambda x: x["city"],
        )
        return jsonify(result)

    @app.route("/api/routes/destinations", methods=["GET"])
    def route_destinations():
        origin = request.args.get("origin", "").strip()
        if not origin:
            return jsonify({"error": "Origin is required."}), 400
        city = parse_city_name(origin)
        routes = list(db.routes.find({
            "$or": [
                {"origin": {"$regex": f"^{city}", "$options": "i"}},
                {"origin_code": origin.upper()},
            ]
        }))
        destinations = []
        seen = set()
        for r in routes:
            d = r["destination"]
            if d not in seen and d.lower() != city.lower():
                seen.add(d)
                destinations.append({
                    "city": d,
                    "code": r.get("destination_code", CITY_CODES.get(d, "")),
                    "label": city_label(d),
                    "flightType": r.get("flightType", "International"),
                })
        return jsonify(sorted(destinations, key=lambda x: x["city"]))

    @app.route("/api/my-trips", methods=["GET"])
    def my_trips():
        email = request.args.get("email", "").strip().lower()
        if not email:
            return jsonify({"error": "Email is required."}), 400
        bookings = list(db.bookings.find({"user_email": email}).sort("_id", -1))
        upcoming, completed, cancelled = [], [], []
        for b in bookings:
            serialize_doc(b)
            flight = db.flights.find_one({"flight_id": b["flight_id"]})
            if flight:
                enrich_flight(flight)
                serialize_doc(flight)
                b["flight"] = flight
            status = b.get("status", "Confirmed")
            flight_status = (flight or {}).get("status", "")
            if status in ("Cancelled", "Refund Processed") or flight_status == "Cancelled":
                cancelled.append(b)
            elif flight_status in ("On Time", "Boarding", "Delayed"):
                upcoming.append(b)
            else:
                completed.append(b)
        return jsonify({
            "upcoming": upcoming,
            "completed": completed,
            "cancelled": cancelled,
            "all": bookings,
        })

    @app.route("/api/admin/dashboard", methods=["GET"])
    @admin_required
    def admin_dashboard():
        domestic = db.flights.count_documents({"flightType": "Domestic"})
        international = db.flights.count_documents({"flightType": "International"})
        total_flights = db.flights.count_documents({})
        total_bookings = db.bookings.count_documents({})
        passengers = len(db.bookings.distinct("user_email"))
        return jsonify({
            "counters": {
                "total_flights": total_flights,
                "domestic_flights": domestic,
                "international_flights": international,
                "total_bookings": total_bookings,
                "passengers": passengers,
                "delayed_flights": db.flights.count_documents({"status": "Delayed"}),
                "cancelled_flights": db.flights.count_documents({"status": "Cancelled"}),
                "refund_requests": db.refunds.count_documents({}),
                "rebooking_requests": db.rebookings.count_documents({}),
                "revenue": total_bookings * 540.0,
            }
        })

    @app.route("/api/admin/bookings", methods=["GET"])
    @admin_required
    def admin_bookings():
        q = request.args.get("q", "").strip().upper()
        query = {}
        if q:
            query["booking_id"] = {"$regex": q, "$options": "i"}
        bookings = list(db.bookings.find(query).sort("_id", -1).limit(200))
        for b in bookings:
            serialize_doc(b)
            flight = db.flights.find_one({"flight_id": b["flight_id"]})
            if flight:
                enrich_flight(flight)
                serialize_doc(flight)
                b["flight"] = flight
        return jsonify(bookings)

    @app.route("/api/admin/passengers", methods=["GET"])
    @admin_required
    def admin_passengers():
        q = request.args.get("q", "").strip().lower()
        pipeline = [
            {"$group": {
                "_id": "$user_email",
                "first_name": {"$first": "$first_name"},
                "last_name": {"$first": "$last_name"},
                "phone": {"$first": "$phone"},
                "booking_count": {"$sum": 1},
            }},
            {"$sort": {"_id": 1}},
        ]
        passengers = list(db.bookings.aggregate(pipeline))
        result = []
        for p in passengers:
            email = p["_id"] or ""
            if q and q not in email.lower() and q not in (p.get("first_name") or "").lower():
                continue
            user_bookings = list(db.bookings.find({"user_email": email}))
            upcoming = [b for b in user_bookings if b.get("status") == "Confirmed"]
            cancelled = [b for b in user_bookings if b.get("status") in ("Cancelled", "Refund Processed")]
            result.append({
                "email": email,
                "first_name": p.get("first_name", ""),
                "last_name": p.get("last_name", ""),
                "phone": p.get("phone", ""),
                "booking_count": p.get("booking_count", 0),
                "upcoming_trips": len(upcoming),
                "cancelled_trips": len(cancelled),
            })
        return jsonify(result)

    @app.route("/api/admin/flights", methods=["POST"])
    @admin_required
    def admin_add_flight():
        data = request.get_json() or {}
        flight_id = data.get("flight_id") or generate_reference("F")
        origin = data.get("origin", "")
        destination = data.get("destination", "")
        ft = data.get("flightType") or flight_type_for_route(origin, destination)
        doc = {
            "flight_id": flight_id,
            "flight_number": data.get("flight_number", flight_id),
            "airline": data.get("airline", "SkyJet Airways"),
            "origin": origin,
            "destination": destination,
            "flightType": ft,
            "scheduled_time": data.get("scheduled_time", data.get("departureTime", "Today, 10:00 AM")),
            "departure_time": data.get("departure_time", data.get("departureTime", "")),
            "arrival_time": data.get("arrival_time", data.get("arrivalTime", "")),
            "gate": data.get("gate", "TBD"),
            "terminal": data.get("terminal", "Terminal 1"),
            "boarding_time": data.get("boarding_time", ""),
            "status": data.get("status", "On Time"),
            "seats_left": int(data.get("availableSeats", data.get("seats_left", 100))),
            "availableSeats": int(data.get("availableSeats", data.get("seats_left", 100))),
            "type": "standard",
            "delay_duration": "",
        }
        db.flights.insert_one(doc)
        serialize_doc(doc)
        return jsonify({"message": "Flight added.", "flight": doc}), 201

    @app.route("/api/admin/flights/<flight_id>", methods=["PUT", "DELETE"])
    @admin_required
    def admin_manage_flight(flight_id):
        if request.method == "DELETE":
            db.flights.delete_one({"flight_id": flight_id})
            return jsonify({"message": "Flight deleted."})
        data = request.get_json() or {}
        updates = {k: v for k, v in data.items() if k != "_id"}
        if "availableSeats" in updates:
            updates["seats_left"] = updates["availableSeats"]
        if "seats_left" in updates:
            updates["availableSeats"] = updates["seats_left"]
        db.flights.update_one({"flight_id": flight_id}, {"$set": updates})
        flight = db.flights.find_one({"flight_id": flight_id})
        enrich_flight(flight)
        serialize_doc(flight)
        return jsonify({"message": "Flight updated.", "flight": flight})

    @app.route("/api/admin/refunds", methods=["GET"])
    @admin_required
    def admin_refunds():
        refunds = list(db.refunds.find({}).sort("_id", -1))
        for r in refunds:
            serialize_doc(r)
        return jsonify(refunds)

    @app.route("/api/admin/rebookings", methods=["GET"])
    @admin_required
    def admin_rebookings():
        items = list(db.rebookings.find({}).sort("_id", -1))
        for r in items:
            serialize_doc(r)
        return jsonify(items)

    return {
        "enrich_flight": enrich_flight,
        "admin_required": admin_required,
    }
