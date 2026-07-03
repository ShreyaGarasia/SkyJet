import os
import sys
import random
import string
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

from bootstrap import ensure_bootstrap, register_extensions, enrich_flight, require_admin
from skyjet_data import flight_type_for_route, parse_city_name

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.server_info()
    db = client["skyjet"]
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    sys.exit(1)

# List of 22 Asian Airports
AIRPORTS = [
    {"code": "SIN", "name": "Singapore (SIN)"},
    {"code": "DEL", "name": "Delhi (DEL)"},
    {"code": "BOM", "name": "Mumbai (BOM)"},
    {"code": "BLR", "name": "Bangalore (BLR)"},
    {"code": "MAA", "name": "Chennai (MAA)"},
    {"code": "HYD", "name": "Hyderabad (HYD)"},
    {"code": "CCU", "name": "Kolkata (CCU)"},
    {"code": "KUL", "name": "Kuala Lumpur (KUL)"},
    {"code": "BKK", "name": "Bangkok (BKK)"},
    {"code": "CGK", "name": "Jakarta (CGK)"},
    {"code": "DPS", "name": "Bali (DPS)"},
    {"code": "MNL", "name": "Manila (MNL)"},
    {"code": "HKG", "name": "Hong Kong (HKG)"},
    {"code": "HND", "name": "Tokyo (HND)"},
    {"code": "KIX", "name": "Osaka (KIX)"},
    {"code": "ICN", "name": "Seoul (ICN)"},
    {"code": "TPE", "name": "Taipei (TPE)"},
    {"code": "DXB", "name": "Dubai (DXB)"},
    {"code": "AUH", "name": "Abu Dhabi (AUH)"},
    {"code": "DOH", "name": "Doha (DOH)"},
    {"code": "HAN", "name": "Hanoi (HAN)"},
    {"code": "SGN", "name": "Ho Chi Minh City (SGN)"}
]

# Random helper generators
def generate_seat():
    row = random.randint(1, 30)
    letter = random.choice(["A", "B", "C", "D", "E", "F"])
    return f"{row}{letter}"

def generate_reference(prefix="SJ"):
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=5))
    return f"{prefix}-{suffix}"

def get_occupied_seats(flight_id):
    occupied = []
    active_statuses = {"Confirmed"}
    for booking in db.bookings.find(
        {"flight_id": flight_id, "status": {"$in": list(active_statuses)}},
        {"seat": 1}
    ):
        seat = booking.get("seat")
        if seat:
            occupied.append(seat.upper().strip())
    return occupied

# Database Seeding
def seed_database():
    print("Checking database seeding...")
    if db.flights.count_documents({}) > 0:
        print("Database already contains flights — keeping existing passenger and admin data.")
        return

    print("Empty database detected — seeding demo flights and bookings...")
    # 1. Seed Specific Demo Flight Recovery Path for SIN -> HND (Singapore to Tokyo)
    default_flights = [
        # Original Disrupted Flight
        {
            "flight_id": "SJ-412",
            "flight_number": "SJ-412",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "10:30 PM (Tonight)",
            "departure_time": "10:30 PM (Tonight)",
            "arrival_time": "Tomorrow, 06:15 AM",
            "gate": "B18",
            "terminal": "Terminal 3",
            "boarding_time": "09:45 PM",
            "status": "Cancelled",
            "seats_left": 0,
            "type": "original",
            "delay_duration": ""
        },
        # Tonight Alternatives
        {
            "flight_id": "F-TON-1",
            "flight_number": "SJ-416",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "Tonight, 11:45 PM",
            "departure_time": "Tonight, 11:45 PM",
            "arrival_time": "Tomorrow, 07:30 AM",
            "gate": "C04",
            "terminal": "Terminal 1",
            "boarding_time": "11:00 PM",
            "status": "Boarding",
            "seats_left": 2,
            "type": "tonight",
            "delay_duration": ""
        },
        {
            "flight_id": "F-TON-2",
            "flight_number": "SJ-418",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "Tonight, 11:59 PM",
            "departure_time": "Tonight, 11:59 PM",
            "arrival_time": "Tomorrow, 07:45 AM",
            "gate": "B08",
            "terminal": "Terminal 2",
            "boarding_time": "11:15 PM",
            "status": "On Time",
            "seats_left": 5,
            "type": "tonight",
            "delay_duration": ""
        },
        # Tomorrow Alternatives
        {
            "flight_id": "F-TOM-1",
            "flight_number": "SJ-420",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "Tomorrow, 08:30 AM",
            "departure_time": "Tomorrow, 08:30 AM",
            "arrival_time": "Tomorrow, 04:15 PM",
            "gate": "A12",
            "terminal": "Terminal 3",
            "boarding_time": "07:45 AM",
            "status": "On Time",
            "seats_left": 4,
            "type": "tomorrow",
            "delay_duration": ""
        },
        {
            "flight_id": "F-TOM-2",
            "flight_number": "SJ-422",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "Tomorrow, 11:15 AM",
            "departure_time": "Tomorrow, 11:15 AM",
            "arrival_time": "Tomorrow, 07:00 PM",
            "gate": "B02",
            "terminal": "Terminal 3",
            "boarding_time": "10:30 AM",
            "status": "On Time",
            "seats_left": 8,
            "type": "tomorrow",
            "delay_duration": ""
        },
        {
            "flight_id": "F-TOM-3",
            "flight_number": "SJ-424",
            "airline": "SkyJet Airways",
            "origin": "Singapore (SIN)",
            "destination": "Tokyo (HND)",
            "scheduled_time": "Tomorrow, 03:00 PM",
            "departure_time": "Tomorrow, 03:00 PM",
            "arrival_time": "Tomorrow, 10:45 PM",
            "gate": "A15",
            "terminal": "Terminal 2",
            "boarding_time": "02:15 PM",
            "status": "On Time",
            "seats_left": 12,
            "type": "tomorrow",
            "delay_duration": ""
        }
    ]

    for flight in default_flights:
        flight["flightType"] = flight_type_for_route(flight["origin"], flight["destination"])
        flight["availableSeats"] = flight.get("seats_left", 0)
        db.flights.insert_one(flight)

    # 2. Seed 100+ Additional Scheduled Flights between Asian Hubs
    random.seed(1234)
    airlines = ["SkyJet Airways", "SkyJet Express", "SkyJet Asia"]
    for i in range(105):
        # Pick random origin and destination
        origin_ap = random.choice(AIRPORTS)
        while True:
            dest_ap = random.choice(AIRPORTS)
            if dest_ap["code"] != origin_ap["code"]:
                break
        
        flight_num = f"SJ-{random.randint(100, 899)}"
        flight_id = f"F-{flight_num}-{i}"
        
        # Avoid overriding the special demo recovery flight
        if origin_ap["code"] == "SIN" and dest_ap["code"] == "HND" and flight_num == "SJ-412":
            flight_num = "SJ-999"
            flight_id = f"F-{flight_num}-{i}"

        # Generate departure hours, gates, status
        dep_hour = random.randint(0, 23)
        dep_min = random.choice([0, 15, 30, 45])
        dur_hours = random.randint(1, 7)
        dur_mins = random.choice([0, 30])
        
        arr_hour = (dep_hour + dur_hours) % 24
        arr_min = (dep_min + dur_mins) % 60
        
        day = random.choice(["Today", "Tomorrow"])
        scheduled_time = f"{day}, {dep_hour:02d}:{dep_min:02d} {'AM' if dep_hour < 12 else 'PM'}"
        arrival_time = f"{day}, {arr_hour:02d}:{arr_min:02d} {'AM' if arr_hour < 12 else 'PM'}"
        
        gate = f"{random.choice(['A', 'B', 'C', 'D', 'E', 'F'])}{random.randint(1, 28)}"
        terminal = f"Terminal {random.randint(1, 4)}"
        
        # Calculate Boarding time (45 mins prior)
        b_min = (dep_min - 45) % 60
        b_hour = (dep_hour - (1 if dep_min < 45 else 0)) % 24
        boarding_time = f"{b_hour:02d}:{b_min:02d} {'AM' if b_hour < 12 else 'PM'}"
        
        # Status
        rand_stat = random.random()
        if rand_stat < 0.82:
            status = "On Time"
        elif rand_stat < 0.90:
            status = "Delayed"
        elif rand_stat < 0.96:
            status = "Cancelled"
        else:
            status = "Boarding"
            
        delay_duration = ""
        if status == "Delayed":
            delay_duration = f"{random.choice([1, 2, 3, 4])} Hours"

        db.flights.insert_one({
            "flight_id": flight_id,
            "flight_number": flight_num,
            "airline": random.choice(airlines),
            "origin": origin_ap["name"],
            "destination": dest_ap["name"],
            "scheduled_time": scheduled_time,
            "departure_time": scheduled_time,
            "arrival_time": arrival_time,
            "gate": gate,
            "terminal": terminal,
            "boarding_time": boarding_time,
            "status": status,
            "seats_left": random.randint(10, 140),
            "type": "standard",
            "delay_duration": delay_duration
        })

    # 3. Seed Default Bookings
    default_bookings = [
        # Demo cancel recovery
        {
            "booking_id": "SJ987",
            "user_email": "sid.patel@example.com",
            "first_name": "Sid",
            "last_name": "Patel",
            "email": "sid.patel@example.com",
            "phone": "+65 9123 4567",
            "flight_id": "SJ-412",
            "seat": "12A",
            "fare_category": "Premium Economy (Refundable)",
            "refund_amount": 540.00,
            "card_last4": "4321",
            "status": "Confirmed",
            "booking_date": "2026-06-28",
            "cancellation_ref": "",
            "cancellation_time": ""
        },
        # Demo delay
        {
            "booking_id": "SJ777",
            "user_email": "sid.patel@example.com",
            "first_name": "Sid",
            "last_name": "Patel",
            "email": "sid.patel@example.com",
            "phone": "+65 9123 4567",
            "flight_id": "", # Will bind on seed
            "seat": "14C",
            "fare_category": "Economy Standard",
            "refund_amount": 320.00,
            "card_last4": "8899",
            "status": "Confirmed",
            "booking_date": "2026-06-29",
            "cancellation_ref": "",
            "cancellation_time": ""
        },
        # Other passengers
        {
            "booking_id": "SJ555",
            "user_email": "rahul.kumar@example.com",
            "first_name": "Rahul",
            "last_name": "Kumar",
            "email": "rahul.kumar@example.com",
            "phone": "+91 98765 43210",
            "flight_id": "", # Will bind on seed
            "seat": "05B",
            "fare_category": "Business Class",
            "refund_amount": 890.00,
            "card_last4": "1122",
            "status": "Confirmed",
            "booking_date": "2026-06-30",
            "cancellation_ref": "",
            "cancellation_time": ""
        }
    ]

    # Find a delayed flight for SJ777 and a standard flight for SJ555
    delayed_flight = db.flights.find_one({"status": "Delayed"})
    if delayed_flight:
        default_bookings[1]["flight_id"] = delayed_flight["flight_id"]
    else:
        # Fallback
        default_bookings[1]["flight_id"] = "SJ-412"

    ontime_flight = db.flights.find_one({"status": "On Time"})
    if ontime_flight:
        default_bookings[2]["flight_id"] = ontime_flight["flight_id"]
    else:
        default_bookings[2]["flight_id"] = "SJ-412"

    for booking in default_bookings:
        db.bookings.insert_one(booking)
        
        # Write confirmation notifications
        flight_info = db.flights.find_one({"flight_id": booking["flight_id"]})
        flight_no = flight_info["flight_number"] if flight_info else "SJ-XXX"
        
        # Add notifications logs
        log_notification(booking["booking_id"], booking["user_email"], "Confirmed", 
                         f"Booking Confirmed!", 
                         f"Your flight {flight_no} is confirmed for departure. Seat assigned: {booking['seat']}.")

    print("Database seeding completed.")

# Helper to log notifications / email / sms logs
def log_notification(booking_id, user_email, event_type, title, message):
    timestamp = datetime.now().strftime("%Y-%m-%d %I:%M %p")
    
    # 1. App Notification
    db.notifications.insert_one({
        "notification_id": generate_reference("NT"),
        "booking_id": booking_id,
        "user_email": user_email,
        "type": "app",
        "title": title,
        "message": message,
        "timestamp": timestamp
    })
    # 2. Simulated Email Log
    db.notifications.insert_one({
        "notification_id": generate_reference("EM"),
        "booking_id": booking_id,
        "user_email": user_email,
        "type": "email",
        "title": f"📧 [SkyJet Alert] {title}",
        "message": f"Dear Passenger,\n\n{message}\n\nThank you for choosing SkyJet Airways.\nSafe Travels!",
        "timestamp": timestamp
    })
    # 3. Simulated SMS Log
    db.notifications.insert_one({
        "notification_id": generate_reference("SM"),
        "booking_id": booking_id,
        "user_email": user_email,
        "type": "sms",
        "title": "📱 SMS Alert",
        "message": f"[SkyJet] {title}: {message}",
        "timestamp": timestamp
    })

# Seed database on startup
seed_database()
ensure_bootstrap(db)
admin_required = require_admin(db)

# Helper: Get Passenger booking details
def get_booking_details_extended(booking_id):
    booking = db.bookings.find_one({"booking_id": booking_id.upper().strip()})
    if not booking:
        return None
        
    flight = db.flights.find_one({"flight_id": booking["flight_id"]})
    
    # Serialize MongoDB IDs
    booking["_id"] = str(booking["_id"])
    if flight:
        flight["_id"] = str(flight["_id"])
        enrich_flight(flight)
        
    return {
        "passenger": booking,
        "flight": flight
    }

# ----------------- REST ENDPOINTS -----------------

# Unified route decorators to support both /api/... and raw endpoints
# This satisfies all backend API requirements: retrieve, cancel, rebook, refund, etc.

@app.route("/api/retrieve-booking", methods=["POST"])
@app.route("/retrieve-booking", methods=["POST"])
def retrieve_booking():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    last_name = data.get("last_name", "").lower().strip()

    if not booking_id or not last_name:
        return jsonify({"error": "Booking ID and Last Name are required"}), 400

    details = get_booking_details_extended(booking_id)
    if not details or details["passenger"]["last_name"].lower() != last_name:
        return jsonify({"error": "Booking reference or passenger last name mismatch. Booking not found."}), 404

    return jsonify(details)

@app.route("/api/booking/<booking_id>", methods=["GET"])
@app.route("/booking/<booking_id>", methods=["GET"])
def get_booking_by_id(booking_id):
    details = get_booking_details_extended(booking_id)
    if not details:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(details)

@app.route("/api/flight-status/<flight_id>", methods=["GET"])
@app.route("/flight-status/<flight_id>", methods=["GET"])
def get_flight_status(flight_id):
    flight = db.flights.find_one({"flight_id": flight_id})
    if not flight:
        return jsonify({"error": "Flight not found"}), 404
    flight["_id"] = str(flight["_id"])
    return jsonify(flight)

@app.route("/api/available-flights", methods=["GET"])
@app.route("/available-flights", methods=["GET"])
def get_available_flights():
    origin = request.args.get("origin", "").strip()
    destination = request.args.get("destination", "").strip()

    if origin and destination:
        o_city = parse_city_name(origin)
        d_city = parse_city_name(destination)
        if o_city.lower() == d_city.lower():
            return jsonify({"error": "Origin and Destination cannot be the same."}), 400
        route = db.routes.find_one({
            "$or": [
                {"origin": o_city, "destination": d_city},
                {"origin": {"$regex": f"^{o_city}$", "$options": "i"},
                 "destination": {"$regex": f"^{d_city}$", "$options": "i"}},
            ]
        })
        if not route:
            return jsonify({"error": "No valid route found for the selected cities."}), 400
    
    query = {"status": {"$ne": "Cancelled"}}
    if origin:
        query["origin"] = {"$regex": parse_city_name(origin), "$options": "i"}
    if destination:
        query["destination"] = {"$regex": parse_city_name(destination), "$options": "i"}
        
    flights_list = list(db.flights.find(query).limit(50))
    for f in flights_list:
        f["_id"] = str(f["_id"])
        enrich_flight(f)
        
    return jsonify(flights_list)

@app.route("/api/book-flight", methods=["POST"])
@app.route("/book-flight", methods=["POST"])
def book_flight_endpoint():
    data = request.json or {}
    flight_id = data.get("flight_id")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "+65 9000 0000").strip()
    user_email = data.get("userEmail", "").strip().lower()
    seat = data.get("seat", "").strip().upper()

    if not flight_id or not first_name or not last_name or not email:
        return jsonify({"error": "Flight ID, first/last name, and email are required"}), 400

    flight = db.flights.find_one({"flight_id": flight_id})
    if not flight:
        return jsonify({"error": "Flight not found"}), 404

    if flight.get("seats_left", 0) <= 0:
        return jsonify({"error": "No seats left on this flight"}), 400

    occupied_seats = get_occupied_seats(flight_id)
    if seat and seat in occupied_seats:
        return jsonify({"error": f"Seat {seat} has already been booked. Please choose another seat."}), 400

    if not seat:
        for row in range(1, 31):
            for letter in ["A", "B", "C", "D", "E", "F"]:
                candidate = f"{row}{letter}"
                if candidate not in occupied_seats:
                    seat = candidate
                    break
            if seat:
                break

    if not seat:
        return jsonify({"error": "No seats are available on this flight."}), 400

    # PNR generator
    booking_id = generate_reference("SJ")
    while db.bookings.find_one({"booking_id": booking_id}):
        booking_id = generate_reference("SJ")

    booking = {
        "booking_id": booking_id,
        "user_email": user_email if user_email else email,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "flight_id": flight_id,
        "seat": seat,
        "fare_category": "Premium Economy (Refundable)",
        "refund_amount": 540.00,
        "card_last4": ''.join(random.choices(string.digits, k=4)),
        "status": "Confirmed",
        "booking_date": datetime.now().strftime("%Y-%m-%d"),
        "cancellation_ref": "",
        "cancellation_time": ""
    }

    db.bookings.insert_one(booking)
    db.flights.update_one({"flight_id": flight_id}, {"$inc": {"seats_left": -1}})

    # Log confirm notifications
    log_notification(booking_id, booking["user_email"], "Confirmed", 
                     "Booking Confirmation", 
                     f"Your booking reference {booking_id} on flight {flight['flight_number']} is confirmed.")
    ft = flight.get("flightType") or flight_type_for_route(flight.get("origin", ""), flight.get("destination", ""))
    if ft == "International":
        log_notification(booking_id, booking["user_email"], "Passport Reminder",
                         "Passport Reminder", "Please carry a valid passport.")
        log_notification(booking_id, booking["user_email"], "Visa Reminder",
                         "Visa Reminder", "Visa requirements depend on destination.")

    booking["_id"] = str(booking["_id"])
    return jsonify({
        "message": "Flight booked successfully!",
        "booking_id": booking_id,
        "booking": booking
    })

@app.route("/api/cancel-booking", methods=["POST"])
@app.route("/cancel-booking", methods=["POST"])
def cancel_booking():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()

    if not booking_id:
        return jsonify({"error": "Booking ID is required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking["status"] == "Cancelled":
        return jsonify({"error": "Booking is already cancelled"}), 400

    cancellation_ref = generate_reference("RF")
    cancellation_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    # Release seat on current flight
    db.flights.update_one({"flight_id": booking["flight_id"]}, {"$inc": {"seats_left": 1}})

    # Update Booking to Cancelled
    db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "Cancelled",
            "cancellation_ref": cancellation_ref,
            "cancellation_time": cancellation_time
        }}
    )

    # Log refund tracking entry
    refund_amount = booking.get("refund_amount", 540.00)
    db.refunds.insert_one({
        "refund_id": generate_reference("REF"),
        "booking_id": booking_id,
        "amount": refund_amount,
        "status": "Approved",
        "reference": cancellation_ref,
        "processing_time": "3-5 Business Days"
    })

    # Log cancel notifications
    log_notification(booking_id, booking["user_email"], "Cancelled", 
                     "Flight Cancelled", 
                     f"Your flight booking {booking_id} has been cancelled. Cancellation PNR: {cancellation_ref}.")

    updated = get_booking_details_extended(booking_id)
    return jsonify({
        "message": "Booking cancelled successfully.",
        "booking": updated["passenger"],
        "cancellation_ref": cancellation_ref,
        "cancellation_time": cancellation_time
    })

@app.route("/api/rebook-flight", methods=["POST"])
@app.route("/rebook-flight", methods=["POST"])
def rebook_flight():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    new_flight_id = data.get("new_flight_id", "").strip()

    if not booking_id or not new_flight_id:
        return jsonify({"error": "Booking ID and alternative Flight ID are required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    old_flight_id = booking["flight_id"]
    new_flight = db.flights.find_one({"flight_id": new_flight_id})
    
    if not new_flight:
        return jsonify({"error": "Target alternative flight not found"}), 404

    if new_flight.get("seats_left", 0) <= 0:
        return jsonify({"error": "No seats left on selected flight"}), 400

    # Transact booking updates
    new_seat = generate_seat()
    db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "flight_id": new_flight_id,
            "seat": new_seat,
            "status": "Confirmed"
        }}
    )

    # Decrement seats in the new flight
    db.flights.update_one({"flight_id": new_flight_id}, {"$inc": {"seats_left": -1}})
    
    # Increment seats in old flight if it wasn't cancelled (for voluntary changes)
    old_flight = db.flights.find_one({"flight_id": old_flight_id})
    if old_flight and old_flight["status"] != "Cancelled":
        db.flights.update_one({"flight_id": old_flight_id}, {"$inc": {"seats_left": 1}})

    # Log Rebooking Log entry
    db.rebookings.insert_one({
        "rebook_id": generate_reference("RB"),
        "booking_id": booking_id,
        "old_flight_id": old_flight_id,
        "new_flight_id": new_flight_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
    })

    # Log Rebook notifications
    log_notification(booking_id, booking["user_email"], "Rebooked", 
                     "Flight Rebooked", 
                     f"Your booking {booking_id} has been rebooked to Flight {new_flight['flight_number']}. Seat: {new_seat}.")

    updated = get_booking_details_extended(booking_id)
    return jsonify({
        "message": "Rebooked successfully.",
        "booking": updated
    })

@app.route("/api/refund-request", methods=["POST"])
@app.route("/refund-request", methods=["POST"])
def refund_request():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()

    if not booking_id:
        return jsonify({"error": "Booking ID is required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    refund_ref = generate_reference("REF")
    
    refund_doc = {
        "refund_id": generate_reference("RFD"),
        "booking_id": booking_id,
        "amount": booking.get("refund_amount", 540.00),
        "status": "Approved",
        "reference": refund_ref,
        "processing_time": "3-5 Business Days"
    }
    
    db.refunds.update_one(
        {"booking_id": booking_id},
        {"$setOnInsert": refund_doc},
        upsert=True
    )
    
    # Send refund notification
    log_notification(booking_id, booking["user_email"], "Refund Approved", 
                     "Refund Approved", 
                     f"Refund request approved for booking {booking_id}. Refund PNR Reference: {refund_ref}.")

    res_doc = db.refunds.find_one({"booking_id": booking_id})
    res_doc["_id"] = str(res_doc["_id"])
    return jsonify(res_doc)

@app.route("/api/notifications", methods=["GET"])
@app.route("/notifications", methods=["GET"])
def get_notifications():
    booking_id = request.args.get("booking_id")
    email = request.args.get("email")

    query = {}
    if booking_id:
        query["booking_id"] = booking_id.upper().strip()
    if email:
        query["user_email"] = email.strip().lower()

    # If no filters, return all notifications
    notifications_list = list(db.notifications.find(query).sort("_id", -1).limit(100))
    for n in notifications_list:
        n["_id"] = str(n["_id"])

    return jsonify(notifications_list)

@app.route("/api/flight-seats/<flight_id>", methods=["GET"])
def get_flight_seats(flight_id):
    flight = db.flights.find_one({"flight_id": flight_id})
    if not flight:
        return jsonify({"error": "Flight not found"}), 404

    return jsonify({
        "flight_id": flight_id,
        "occupied_seats": sorted(get_occupied_seats(flight_id))
    })

@app.route("/api/download-ticket", methods=["GET"])
@app.route("/download-ticket", methods=["GET"])
def download_ticket():
    # Returns metadata to download
    booking_id = request.args.get("booking_id", "").upper().strip()
    details = get_booking_details_extended(booking_id)
    if not details:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(details)

@app.route("/api/download-cancellation", methods=["GET"])
@app.route("/download-cancellation", methods=["GET"])
def download_cancellation():
    booking_id = request.args.get("booking_id", "").upper().strip()
    details = get_booking_details_extended(booking_id)
    if not details:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(details)

# ----------------- ADMIN DASHBOARD STATS -----------------

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    total_flights = db.flights.count_documents({})
    domestic_flights = db.flights.count_documents({"flightType": "Domestic"})
    international_flights = db.flights.count_documents({"flightType": "International"})
    total_bookings = db.bookings.count_documents({})
    active_passengers = db.bookings.count_documents({"status": {"$ne": "Cancelled"}})
    cancelled_flights = db.flights.count_documents({"status": "Cancelled"})
    delayed_flights = db.flights.count_documents({"status": "Delayed"})
    
    refund_requests = db.refunds.count_documents({})
    rebooking_requests = db.rebookings.count_documents({})

    # Mock dynamic distribution metrics for premium charts
    flight_status_dist = [
        {"name": "On Time", "count": db.flights.count_documents({"status": "On Time"})},
        {"name": "Delayed", "count": delayed_flights},
        {"name": "Cancelled", "count": cancelled_flights},
        {"name": "Boarding", "count": db.flights.count_documents({"status": "Boarding"})}
    ]

    # Daily booking records mock (past 7 days trend)
    daily_bookings = [
        {"day": "Mon", "count": 12},
        {"day": "Tue", "count": 19},
        {"day": "Wed", "count": 15},
        {"day": "Thu", "count": 22},
        {"day": "Fri", "count": 30},
        {"day": "Sat", "count": 25},
        {"day": "Sun", "count": total_bookings} # Match current database count
    ]

    # Revenue simulation
    revenue = total_bookings * 540.00
    refunded_revenue = refund_requests * 540.00

    return jsonify({
        "counters": {
            "total_flights": total_flights,
            "domestic_flights": domestic_flights,
            "international_flights": international_flights,
            "total_bookings": total_bookings,
            "active_passengers": active_passengers,
            "cancelled_flights": cancelled_flights,
            "delayed_flights": delayed_flights,
            "refund_requests": refund_requests,
            "rebooking_requests": rebooking_requests
        },
        "charts": {
            "flight_status_dist": flight_status_dist,
            "daily_bookings": daily_bookings,
            "revenue": {
                "total": revenue,
                "refunded": refunded_revenue,
                "net": revenue - refunded_revenue
            }
        }
    })

# ----------------- ADMIN CONTROLS / SIMULATOR -----------------

@app.route("/api/admin/disrupt", methods=["POST"])
@admin_required
def admin_disrupt_flight():
    data = request.json or {}
    flight_id = data.get("flight_id")
    status = data.get("status")

    if not flight_id or not status:
        return jsonify({"error": "Flight ID and status are required"}), 400

    try:
        flight = db.flights.find_one({"flight_id": flight_id})
        if not flight:
            return jsonify({"error": "Flight not found"}), 404

        # Update in DB
        delay_duration = ""
        if status == "Delayed":
            delay_duration = "2 Hours"

        result = db.flights.update_one(
            {"flight_id": flight_id},
            {"$set": {"status": status, "delay_duration": delay_duration}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Flight not found for update"}), 404

        # Find all passengers impacted by this flight status disruption
        impacted_bookings = list(db.bookings.find({"flight_id": flight_id}))
        
        for b in impacted_bookings:
            try:
                if status == "Cancelled":
                    # Send cancellation notifications
                    log_notification(b["booking_id"], b["user_email"], "Flight Cancelled", 
                                     f"Disruption Alert: Flight {flight['flight_number']} Cancelled", 
                                     f"Your scheduled flight {flight['flight_number']} has been cancelled due to weather disruptions. Use the SkyJet Self-Service Recovery Portal to rebook or refund.")
                elif status == "Delayed":
                    log_notification(b["booking_id"], b["user_email"], "Flight Delayed", 
                                     f"Disruption Alert: Flight {flight['flight_number']} Delayed", 
                                     f"Your flight {flight['flight_number']} is delayed by {delay_duration}. Vouchers are loaded on your portal.")
                elif status == "Boarding":
                    log_notification(b["booking_id"], b["user_email"], "Boarding Started", 
                                     f"Boarding Alert: Flight {flight['flight_number']} Boarding", 
                                     f"Boarding has started for flight {flight['flight_number']}. Please proceed to your gate.")
                elif status == "On Time":
                    log_notification(b["booking_id"], b["user_email"], "Flight On Time", 
                                     f"Update: Flight {flight['flight_number']} On Time", 
                                     f"Your flight {flight['flight_number']} is operating on schedule.")
            except Exception as notif_err:
                print(f"Warning: Failed to log notification for booking {b['booking_id']}: {notif_err}")
                # Continue anyway - don't fail the entire operation

        return jsonify({
            "message": f"Flight {flight['flight_number']} updated to {status}.",
            "flight_id": flight_id,
            "status": status,
            "updated": True
        }), 200
        
    except Exception as e:
        print(f"Error in admin_disrupt_flight: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Backwards compatible simulation endpoints (admin-only)
@app.route("/api/simulate-status", methods=["POST"])
@admin_required
def simulate_status_endpoint():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    status = data.get("status", "").strip()

    if not booking_id or not status:
        return jsonify({"error": "Booking ID and Status are required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    # Trigger admin disruption on flight
    db.flights.update_one(
        {"flight_id": booking["flight_id"]},
        {"$set": {"status": status}}
    )
    
    # Notify passenger
    log_notification(booking_id, booking["user_email"], "Disruption Simulator", 
                     f"Flight Status Changed", 
                     f"Flight operations control has updated the status of flight to: {status}.")

    updated = get_booking_details_extended(booking_id)
    return jsonify({
        "message": f"Flight status updated to {status}.",
        "booking": updated
    })

# ----------------- CHATBOT ENGINE (rule-based, not LLM) -----------------

def _chat_booking_intent(msg):
    booking_words = ("book", "booking", "reserve", "purchase", "buy", "ticket")
    new_words = ("new", "another", "fresh", "how to", "how do")
    return any(w in msg for w in booking_words) and (
        any(w in msg for w in new_words) or "flight" in msg or "ticket" in msg
    )

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    passenger = None
    flight = None
    if booking_id:
        details = get_booking_details_extended(booking_id)
        if details:
            passenger = details["passenger"]
            flight = details["flight"]

    cleaned_msg = message.lower().strip()
    reply_text = ""
    options = None

    # --- Intents that work with or without an active booking ---
    if _chat_booking_intent(cleaned_msg):
        reply_text = (
            "To book a new SkyJet flight:\n"
            "1. Open the **Book Flight** tab in the menu.\n"
            "2. Choose origin and destination, then click **Search Flights**.\n"
            "3. Pick a flight, select an available seat (green = free, red = taken), and complete passenger details.\n"
            "4. After payment you receive a PNR and can download your ticket PDF from **My Trips** or the booking dashboard."
        )
        options = [
            {"label": "Go to Book Flight", "value": "go_book_flight"},
            {"label": "View My Trips", "value": "go_my_trips"}
        ]

    elif any(w in cleaned_msg for w in ("download", "pdf", "boarding pass", "print")):
        if passenger:
            reply_text = (
                f"Your ticket for booking **{passenger['booking_id']}** is ready. "
                f"Open your booking dashboard or **My Trips** and click **Download PDF** / **Ticket PDF** "
                f"for flight {flight['flight_number']}, seat {passenger.get('seat', 'TBD')}."
            )
            options = [{"label": "View Ticket", "value": "go_view_ticket"}]
        else:
            reply_text = (
                "Retrieve your booking with **Booking ID + last name** on Home, or sign in and open **My Trips**. "
                "Then use **Download PDF** on your itinerary card."
            )
            options = [
                {"label": "Retrieve Booking", "value": "go_retrieve_booking"},
                {"label": "Go to Book Flight", "value": "go_book_flight"}
            ]

    elif any(w in cleaned_msg for w in ("boarding", "board", "gate")):
        if passenger and flight:
            reply_text = (
                f"Flight **{flight['flight_number']}** — status: **{flight['status']}**. "
                f"Gate **{flight.get('gate', 'TBD')}**, boarding **{flight.get('boarding_time', 'see airport screens')}**. "
                f"Your seat: **{passenger.get('seat', 'TBD')}**."
            )
            if flight["status"] == "Boarding":
                options = [{"label": "Download Boarding Pass", "value": "go_view_ticket"}]
        else:
            reply_text = "Retrieve your booking first so I can show gate, boarding time, and seat."
            options = [{"label": "Retrieve Booking", "value": "go_retrieve_booking"}]

    elif any(w in cleaned_msg for w in ("delay", "delayed", "late")):
        if passenger and flight:
            if flight["status"] == "Delayed":
                reply_text = (
                    f"Flight **{flight['flight_number']}** is **Delayed**"
                    f"{(' by ' + flight.get('delay_duration')) if flight.get('delay_duration') else ''}. "
                    "Meal vouchers and rebooking options are on your dashboard. You may also claim a refund if eligible."
                )
                options = [
                    {"label": "Rebook Flight", "value": "rebook_menu"},
                    {"label": "Refund Options", "value": "refund_claim"}
                ]
            else:
                reply_text = f"Flight **{flight['flight_number']}** is currently **{flight['status']}** — no delay on record."
        else:
            reply_text = "Retrieve your booking to check delay status and vouchers."
            options = [{"label": "Retrieve Booking", "value": "go_retrieve_booking"}]

    elif any(w in cleaned_msg for w in ("hello", "hi", "hey", "help", "start")):
        if passenger:
            reply_text = (
                f"Hello {passenger['first_name']}! I'm your SkyJet assistant. "
                f"Your flight **{flight['flight_number']}** is **{flight['status']}**. "
                "Ask about booking a new trip, refunds, rebooking, boarding, or downloading your ticket."
            )
            options = [
                {"label": "Book New Flight", "value": "go_book_flight"},
                {"label": "Flight Status", "value": "help_disruption"},
                {"label": "Download Ticket", "value": "go_view_ticket"}
            ]
        else:
            reply_text = (
                "Hello! I can help you **book a new flight**, **retrieve a booking**, "
                "or handle **cancellations, delays, refunds, and rebooking**. What do you need?"
            )
            options = [
                {"label": "Book a Flight", "value": "go_book_flight"},
                {"label": "Retrieve Booking", "value": "go_retrieve_booking"},
                {"label": "Disruption Help", "value": "help_disruption"}
            ]

    elif not booking_id or not passenger:
        reply_text = (
            "To manage an existing trip, use **Manage Trip** or **My Trips** with your Booking ID and last name. "
            "To buy a new ticket, open **Book Flight** in the menu."
        )
        options = [
            {"label": "Book a Flight", "value": "go_book_flight"},
            {"label": "Retrieve Booking", "value": "go_retrieve_booking"}
        ]

    elif "refund" in cleaned_msg:
        if passenger["status"] in ("Refunded", "Cancelled", "Refund Processed"):
            reply_text = f"Your refund is processed. It should appear on card ending **{passenger['card_last4']}** within 3–5 business days."
        elif flight["status"] == "Cancelled":
            reply_text = (
                f"You're eligible for a **100% refund** of ${passenger['refund_amount']:.2f} "
                f"to card ending **{passenger['card_last4']}**. Submit the claim now?"
            )
            options = [
                {"label": "Confirm Refund Claim", "value": "execute_refund"},
                {"label": "Rebook Instead", "value": "rebook_menu"}
            ]
        else:
            reply_text = (
                f"Flight **{flight['flight_number']}** is **{flight['status']}**. "
                "Voluntary refunds follow fare rules; airline cancellations are fully refundable."
            )
            options = [
                {"label": "Rebook Flight", "value": "rebook_menu"},
                {"label": "Refund Policies", "value": "refund_rules"}
            ]

    elif "tonight" in cleaned_msg and passenger and flight:
        reply_text = (
            "Best alternative **tonight**:\n"
            "• **SJ-416** — Tonight 11:45 PM, Gate C04\n"
            "Confirm to rebook your PNR at no extra charge."
        )
        options = [
            {"label": "Confirm Rebook: SJ-416", "value": "confirm_sj416"},
            {"label": "Flights Tomorrow", "value": "flights_tomorrow"}
        ]

    elif "tomorrow" in cleaned_msg and passenger and flight:
        reply_text = (
            "Best alternative **tomorrow**:\n"
            "• **SJ-420** — Tomorrow 08:30 AM, Gate A12\n"
            "Confirm to secure this seat on your booking."
        )
        options = [
            {"label": "Confirm Rebook: SJ-420", "value": "confirm_sj420"},
            {"label": "Flights Tonight", "value": "flights_tonight"}
        ]

    elif any(w in cleaned_msg for w in ("rebook", "change", "alternative", "another flight")):
        if passenger["status"] in ("Refunded", "Cancelled", "Refund Processed"):
            reply_text = "This booking is closed. Book a **new flight** under **Book Flight**, or retrieve another PNR."
            options = [{"label": "Book New Flight", "value": "go_book_flight"}]
        elif flight["status"] == "Cancelled":
            reply_text = "Choose a replacement departure — tonight or tomorrow:"
            options = [
                {"label": "Depart Tonight", "value": "flights_tonight"},
                {"label": "Depart Tomorrow", "value": "flights_tomorrow"}
            ]
        else:
            reply_text = "I can show alternative flights. Prefer tonight or tomorrow?"
            options = [
                {"label": "Depart Tonight", "value": "flights_tonight"},
                {"label": "Depart Tomorrow", "value": "flights_tomorrow"}
            ]

    elif any(w in cleaned_msg for w in ("cancel", "disrupt", "status", "stuck", "problem")):
        if flight["status"] == "Cancelled":
            reply_text = (
                f"Flight **{flight['flight_number']}** is **cancelled**. "
                "Rebook at no extra cost or request a full refund."
            )
            options = [
                {"label": "Rebook Flight", "value": "rebook_menu"},
                {"label": "Request Refund", "value": "refund_claim"}
            ]
        elif flight["status"] == "Delayed":
            reply_text = (
                f"Flight **{flight['flight_number']}** is **delayed**. "
                "Check vouchers on your dashboard or rebook/refund if needed."
            )
            options = [
                {"label": "Rebook Flight", "value": "rebook_menu"},
                {"label": "Refund Options", "value": "refund_claim"}
            ]
        elif flight["status"] == "Boarding":
            reply_text = (
                f"Flight **{flight['flight_number']}** is **boarding now** at gate **{flight.get('gate', 'TBD')}**. "
                f"Seat **{passenger.get('seat', 'TBD')}**."
            )
            options = [{"label": "Download Boarding Pass", "value": "go_view_ticket"}]
        else:
            reply_text = (
                f"Flight **{flight['flight_number']}** is **{flight['status']}**. "
                "No disruption right now. Need to change plans?"
            )
            options = [
                {"label": "Rebook Flight", "value": "rebook_menu"},
                {"label": "Book Another Trip", "value": "go_book_flight"}
            ]

    elif any(w in cleaned_msg for w in ("rule", "policy", "compensation", "eligible")):
        reply_text = (
            "SkyJet policy: airline cancellations and delays over 4 hours → 100% refund or free rebook. "
            "Weather delays → free rebook or refund. Voluntary changes depend on fare class."
        )
        options = [
            {"label": "Rebook Flight", "value": "rebook_menu"},
            {"label": "Request Refund", "value": "refund_claim"}
        ]

    elif any(w in cleaned_msg for w in ("seat", "sit")):
        reply_text = f"Your assigned seat is **{passenger.get('seat', 'not assigned yet')}** on flight **{flight['flight_number']}**."
        options = [{"label": "Download Ticket", "value": "go_view_ticket"}]

    else:
        reply_text = (
            "I can help with:\n"
            "• **Book a new flight**\n"
            "• **Flight status** (delayed / cancelled / boarding)\n"
            "• **Rebook** or **refund**\n"
            "• **Download ticket PDF**\n"
            "Try one of the options below."
        )
        options = [
            {"label": "Book a Flight", "value": "go_book_flight"},
            {"label": "Flight Status", "value": "help_disruption"},
            {"label": "Download Ticket", "value": "go_view_ticket"}
        ]

    return jsonify({
        "reply": reply_text,
        "options": options
    })

# Add backward compatibility for other endpoints
@app.route("/api/login-user", methods=["POST"])
@app.route("/login-user", methods=["POST"])
def login_user_legacy():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db.users.find_one({"email": email, "password": password})
    if not user:
        user = {
            "email": email,
            "password": password,
            "first_name": "Sid",
            "last_name": "Patel",
            "role": "customer",
        }
        db.users.insert_one(user)

    role = user.get("role", "customer")

    # Retrieve all bookings for this user
    user_bookings = list(db.bookings.find({"user_email": email}))
    for b in user_bookings:
        b["_id"] = str(b["_id"])
        flight = db.flights.find_one({"flight_id": b["flight_id"]})
        if flight:
            flight["_id"] = str(flight["_id"])
            b["flight"] = flight

    return jsonify({
        "message": "Login successful!",
        "user": {
            "email": user["email"],
            "firstName": user["first_name"],
            "lastName": user["last_name"],
            "role": role,
        },
        "bookings": user_bookings
    })

@app.route("/api/signup", methods=["POST"])
@app.route("/signup", methods=["POST"])
def signup_legacy():
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()

    if not email or not password or not first_name or not last_name:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "An account with this email already exists"}), 400

    user = {
        "email": email,
        "password": password,
        "first_name": first_name,
        "last_name": last_name,
        "role": "customer",
    }
    db.users.insert_one(user)
    
    return jsonify({
        "message": "Registration successful!",
        "user": {
            "email": email,
            "firstName": first_name,
            "lastName": last_name,
            "role": "customer",
        }
    })

# /api/login -> alias for retrieve booking (used by Hero search in App.jsx)
@app.route("/api/login", methods=["POST"])
@app.route("/login", methods=["POST"])
def login_booking():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    first_name = data.get("first_name", "").lower().strip()
    last_name = data.get("last_name", "").lower().strip()

    if not booking_id or not last_name:
        return jsonify({"error": "Booking ID and Last Name are required"}), 400

    details = get_booking_details_extended(booking_id)
    if not details:
        return jsonify({"error": "Booking not found"}), 404
    
    # Check last name always, first name if provided
    if details["passenger"]["last_name"].lower() != last_name:
        return jsonify({"error": "Last name does not match booking"}), 404
    
    if first_name and details["passenger"]["first_name"].lower() != first_name:
        return jsonify({"error": "First name does not match booking"}), 404

    return jsonify(details)

# /api/recovery/<booking_id> -> returns tonight/tomorrow alternatives + refund info
@app.route("/api/recovery/<booking_id>", methods=["GET"])
def get_recovery_options(booking_id):
    booking_id = booking_id.upper().strip()
    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    flight = db.flights.find_one({"flight_id": booking["flight_id"]})
    if not flight:
        return jsonify({"error": "Associated flight not found"}), 404

    enrich_flight(flight)
    origin_ft = flight.get("flightType", "International")

    origin = flight.get("origin", "")
    destination = flight.get("destination", "")

    # Find available alternative flights — same flightType only (Domestic/International)
    alt_query = {
        "status": {"$ne": "Cancelled"},
        "seats_left": {"$gt": 0},
        "flight_id": {"$ne": booking["flight_id"]},
        "flightType": origin_ft,
    }
    alternatives = list(db.flights.find(alt_query).limit(20))

    # Prefer same route first
    route_alts = [f for f in alternatives if origin[:3].lower() in f.get("origin", "").lower()
                  and destination[:3].lower() in f.get("destination", "").lower()]
    if route_alts:
        alternatives = route_alts + [f for f in alternatives if f not in route_alts]

    for f in alternatives:
        f["_id"] = str(f["_id"])
        enrich_flight(f)

    # Split into tonight / tomorrow buckets
    tonight = [f for f in alternatives if "tonight" in f.get("scheduled_time", "").lower() or "tonight" in f.get("type", "")]
    tomorrow = [f for f in alternatives if "tomorrow" in f.get("scheduled_time", "").lower() or "tomorrow" in f.get("type", "")]

    # If not enough from route-specific, pad from general alternatives
    if len(tonight) < 2 or len(tomorrow) < 2:
        general = list(db.flights.find({
            "status": {"$in": ["On Time", "Boarding"]},
            "seats_left": {"$gt": 0},
            "flight_id": {"$ne": booking["flight_id"]},
            "flightType": origin_ft,
        }).limit(10))
        for g in general:
            g["_id"] = str(g["_id"])
        if len(tonight) < 2:
            # use tonight-type from original seed
            tonight_seed = [f for f in general if f.get("type") == "tonight"]
            tonight = tonight_seed if tonight_seed else general[:3]
        if len(tomorrow) < 2:
            tomorrow_seed = [f for f in general if f.get("type") == "tomorrow"]
            tomorrow = tomorrow_seed if tomorrow_seed else general[3:6]

    return jsonify({
        "booking_id": booking_id,
        "refund_amount": booking.get("refund_amount", 540.00),
        "card_last4": booking.get("card_last4", "XXXX"),
        "flightType": origin_ft,
        "recovery_notes": (
            "Rebooking limited to domestic flights only."
            if origin_ft == "Domestic"
            else "Some itinerary changes may require airline approval. Taxes and visa fees may not be refundable."
        ),
        "options": {
            "tonight": tonight[:3],
            "tomorrow": tomorrow[:4]
        }
    })

# /api/refund -> alias for refund-request (called by SmartRecovery.jsx)
@app.route("/api/refund", methods=["POST"])
def refund_alias():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()

    if not booking_id:
        return jsonify({"error": "Booking ID is required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    refund_ref = generate_reference("REF")
    cancellation_time = datetime.now().strftime("%Y-%m-%d %I:%M %p")

    # Free the seat
    db.flights.update_one({"flight_id": booking["flight_id"]}, {"$inc": {"seats_left": 1}})

    # Update booking status to Refund Processed
    db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "Refund Processed",
            "cancellation_ref": refund_ref,
            "cancellation_time": cancellation_time
        }}
    )

    # Log refund
    db.refunds.insert_one({
        "refund_id": generate_reference("RFD"),
        "booking_id": booking_id,
        "amount": booking.get("refund_amount", 540.00),
        "status": "Approved",
        "reference": refund_ref,
        "processing_time": "3-5 Business Days"
    })

    log_notification(booking_id, booking["user_email"], "Refund Approved",
                     "Refund Approved",
                     f"Refund of ${booking.get('refund_amount', 540.00):.2f} approved for booking {booking_id}. Reference: {refund_ref}. Credit in 3-5 business days.")

    updated = get_booking_details_extended(booking_id)
    flight = updated["flight"] if updated else {}
    if flight:
        flight["_id"] = str(flight.get("_id", ""))

    return jsonify({
        "message": "Refund processed successfully.",
        "refund_ref": refund_ref,
        "booking": {"flight": flight}
    })

# /api/rebook -> alias for rebook-flight (called by SmartRecovery.jsx)
@app.route("/api/rebook", methods=["POST"])
def rebook_alias():
    data = request.json or {}
    booking_id = data.get("booking_id", "").upper().strip()
    new_flight_id = data.get("new_flight_id", "").strip()

    if not booking_id or not new_flight_id:
        return jsonify({"error": "Booking ID and new Flight ID are required"}), 400

    booking = db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    old_flight_id = booking["flight_id"]
    new_flight = db.flights.find_one({"flight_id": new_flight_id})

    if not new_flight:
        return jsonify({"error": "Target flight not found"}), 404

    if new_flight.get("seats_left", 0) <= 0:
        return jsonify({"error": "No seats available on selected flight"}), 400

    new_seat = generate_seat()
    db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"flight_id": new_flight_id, "seat": new_seat, "status": "Confirmed"}}
    )
    db.flights.update_one({"flight_id": new_flight_id}, {"$inc": {"seats_left": -1}})

    old_flight = db.flights.find_one({"flight_id": old_flight_id})
    if old_flight and old_flight.get("status") != "Cancelled":
        db.flights.update_one({"flight_id": old_flight_id}, {"$inc": {"seats_left": 1}})

    db.rebookings.insert_one({
        "rebook_id": generate_reference("RB"),
        "booking_id": booking_id,
        "old_flight_id": old_flight_id,
        "new_flight_id": new_flight_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p")
    })

    log_notification(booking_id, booking["user_email"], "Rebooked",
                     "Flight Rebooked",
                     f"Your booking {booking_id} is rebooked to Flight {new_flight['flight_number']}. New Seat: {new_seat}.")

    updated = get_booking_details_extended(booking_id)
    new_flight_data = updated["flight"] if updated else {}
    if new_flight_data:
        new_flight_data["_id"] = str(new_flight_data.get("_id", ""))

    return jsonify({
        "message": "Rebooked successfully.",
        "booking": {"flight": new_flight_data}
    })

# /api/admin/flights -> full flight list for admin dashboard table
@app.route("/api/admin/flights", methods=["GET"])
@admin_required
def admin_flights():
    # Return full flights list for admin view and include booking counts per flight
    all_flights = list(db.flights.find({}).sort("flight_number", 1))
    for f in all_flights:
        f["_id"] = str(f["_id"])
        enrich_flight(f)
        # Attach bookings count for this flight
        try:
            f_count = db.bookings.count_documents({"flight_id": f.get("flight_id")})
            # Sample up to 5 booking IDs for admin preview
            preview_cursor = db.bookings.find({"flight_id": f.get("flight_id")}, {"booking_id": 1}).limit(5)
            preview_list = [p.get("booking_id") for p in preview_cursor]
        except Exception:
            f_count = 0
            preview_list = []
        f["bookings_count"] = f_count
        f["bookings_preview"] = preview_list
        f["bookings_more"] = max(0, f_count - len(preview_list))
    return jsonify(all_flights)

@app.route("/api/admin/flight-bookings/<flight_id>", methods=["GET"])
@admin_required
def admin_flight_bookings(flight_id):
    bookings = list(db.bookings.find({"flight_id": flight_id}, {
        "booking_id": 1,
        "first_name": 1,
        "last_name": 1,
        "seat": 1,
        "status": 1,
        "booking_date": 1
    }).sort("booking_date", -1))

    result = []
    for b in bookings:
        result.append({
            "booking_id": b.get("booking_id"),
            "first_name": b.get("first_name"),
            "last_name": b.get("last_name"),
            "seat": b.get("seat"),
            "status": b.get("status"),
            "booking_date": b.get("booking_date")
        })
    return jsonify(result)

register_extensions(app, db, {
    "generate_reference": generate_reference,
    "log_notification": log_notification,
    "get_booking_details_extended": get_booking_details_extended,
    "get_occupied_seats": get_occupied_seats,
})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

