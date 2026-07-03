# SkyJet — Backend Service

Lightweight Flask backend that serves the SkyJet frontend with demo flight data, booking management, notifications, and a rule-based chatbot simulator. The backend uses MongoDB (PyMongo) and ships with a seeding routine that populates demo flights, bookings, and notifications on first run.

---

## 🧾 Quick Overview
- Framework: Flask (Python)
- Database: MongoDB (PyMongo)
- Purpose: Simulate airline booking, disruption, rebooking and refund flows for the SkyJet frontend

---

## 🔧 Installation & Run (local)
Windows (PowerShell):

```powershell
# 1. Create virtualenv (recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install requirements
pip install -r requirements.txt

# 3. Configure (optional)
# Create a .env file (optional) to override defaults (MONGO_URI, FLASK settings)
# Example .env:
# MONGO_URI=mongodb://localhost:27017/

# 4. Start the backend
python app.py
```

macOS / Linux (bash):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Default server: http://127.0.0.1:5000

---

## 📜 Available Scripts (backend)

| Script | Command | Description |
|---|---|---|
| **Start (dev)** | `python app.py` | Run the Flask development server (debug mode) |
| **Install deps** | `pip install -r requirements.txt` | Install Python dependencies |
| **Seed DB** | Runs automatically on first start | Seeds demo flights, bookings, and notifications in MongoDB |

---

## 🔌 Public API Endpoints
The backend exposes both `/api/...` and shorthand routes for compatibility. All responses are JSON.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/retrieve-booking` | POST | Retrieve a booking by `booking_id` + `last_name`. Body: `{ booking_id, last_name }` |
| `/api/booking/:booking_id` | GET | Get booking + flight details by booking id |
| `/api/flight-status/:flight_id` | GET | Get a single flight status/metadata |
| `/api/available-flights` | GET | Query available flights. Query params: `origin`, `destination` |
| `/api/book-flight` | POST | Book a seat on a flight. Body: `{ flight_id, firstName, lastName, email, seat? }` |
| `/api/cancel-booking` | POST | Cancel a booking. Body: `{ booking_id }` |
| `/api/rebook-flight` | POST | Rebook an existing PNR to a new flight. Body: `{ booking_id, new_flight_id }` |
| `/api/refund-request` | POST | Create a refund record / request for a booking. Body: `{ booking_id }` |
| `/api/notifications` | GET | Get notifications for a booking or email: `?booking_id=SJ987` or `?email=foo@bar.com` |
| `/api/flight-seats/:flight_id` | GET | Returns occupied seats for a flight |
| `/api/recovery/:booking_id` | GET | Returns tonight/tomorrow alternatives + refund info (used by SmartRecovery) |
| `/api/download-ticket` | GET | Returns booking details (used to download ticket metadata) |
| `/api/admin/stats` | GET | Admin-only stats for dashboard (requires admin role) |
| `/api/admin/flights` | GET | Admin: full flights list with booking counts (requires admin role) |
| `/api/admin/disrupt` | POST | Admin: change a flight's operational status (Delayed/Cancelled/Boarding/On Time) |
| `/api/chat` | POST | Simple rule-based chatbot. Body: `{ booking_id?, message }` |
| `/api/login-user` | POST | Legacy login endpoint used by Admin quick sign-in (accepts `email` + `password`) |

---

## 🔎 Example Requests
Retrieve booking (curl):

```bash
curl -X POST http://127.0.0.1:5000/api/retrieve-booking \
  -H "Content-Type: application/json" \
  -d '{"booking_id":"SJ987","last_name":"Patel"}'
```

Rebook a booking (curl):

```bash
curl -X POST http://127.0.0.1:5000/api/rebook \
  -H "Content-Type: application/json" \
  -d '{"booking_id":"SJ987","new_flight_id":"F-TON-1"}'
```

Get notifications for a booking:

```bash
curl "http://127.0.0.1:5000/api/notifications?booking_id=SJ987"
```

---

## 🏗️ File Architecture (backend)

- `app.py` — Main Flask application; routes, DB seeding, and startup.
- `bootstrap.py` — Helper functions for initializing DB collections, registering Flask extensions, and admin middleware (e.g. `require_admin`).
- `skyjet_data.py` — Utilities for flight type inference, city parsing, and other domain helpers.
- `requirements.txt` — Python package list used by the project.
- `README.md` — (this file)

---

## 🧠 Architecture & Data Flow

1. On startup, `app.py` connects to MongoDB and calls `seed_database()` if flights collection is empty. This seeds a recovery demo path (SIN→HND) and many synthetic flights + demo bookings.
2. Frontend makes REST calls to the Flask server (port 5000). Key flows:
   - Retrieve booking → `/api/retrieve-booking` or `/api/booking/:id`.
   - When a booking's flight is `Cancelled`, frontend calls `/api/recovery/:booking_id` to fetch alternatives and refund metadata.
   - Rebook/refund flows call `/api/rebook` and `/api/refund` (or `/api/rebook-flight` and `/api/refund-request`).
   - Admin simulator calls `/api/admin/disrupt` to change flight status; the server logs notifications for affected bookings.
3. Notifications are stored in `db.notifications` and delivered by the frontend via `/api/notifications`. The server simulates emails and SMS as separate notification documents.

---

## 🔐 Admin & Security
- Admin endpoints use a lightweight `require_admin` middleware defined in `bootstrap.py`. By default the seed creates a quick admin sign-in usable from the frontend (see `AdminDashboard` quick sign-in button).
- This project is a demo; do not use credentials or seeded DB in production.

---

## ✅ Notes & Next Steps
- The backend is intentionally minimal and simulation-first — swap routes for real production APIs when integrating with live services (payment gateway, ticketing system, messaging).
- If you want, I can add OpenAPI (Swagger) docs and example Postman collection next.

---

If you'd like a matching `README.md` for the root or the frontend adjusted, I can generate that too.

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Start (dev)** | `python app.py` | Run the Flask development server (debug mode) |
| **Install deps** | `pip install -r requirements.txt` | Install Python dependencies |
| **Seed DB** | Runs automatically on first start | Seeds demo flights, bookings, and notifications in MongoDB |

---

## 🖥️ Application Screens

From a backend perspective the service supports the following UI screens (frontend implements visuals):

- Landing / Home — booking lookup and quick recovery search.
- Login Modal — PNR + name lookup; calls `/api/login`.
- Passenger Dashboard — fetches `/api/booking/:id`, `/api/flight-status/:id`, `/api/notifications`.
- Smart Recovery Panel — uses `/api/recovery/:id`, `/api/rebook` and `/api/refund`.
- Admin Dashboard — uses `/api/admin/*` endpoints for stats and simulation.

---

## 🔌 API Integration (summary)

- All endpoints return JSON and are reachable under `/api/*` and their shorthand equivalents.
- Notifications are appended to `db.notifications` by server logic and retrieved via `/api/notifications`.

---

## 🧩 UI Components (backend contracts)

| Component | Endpoint Contracts |
|---|---|
| `Navbar` | `/api/notifications` |
| `Hero` | `/api/login` |
| `LoginModal` | `/api/login`, `/api/login-user` |
| `Dashboard` | `/api/booking/:id`, `/api/flight-status/:id` |
| `SmartRecovery` | `/api/recovery/:id`, `/api/rebook`, `/api/refund` |
| `Chatbot` | `/api/chat` |

---

## 📂 Project Structure

backend/
- app.py
- bootstrap.py
- skyjet_data.py
- requirements.txt
- README.md

---

## ⚙️ Technologies Used

- Python 3.10+
- Flask
- PyMongo (MongoDB)
- python-dotenv

---

## ✨ Features

- Demo booking lifecycle: retrieve, book, cancel, rebook, refund.
- Admin simulator to change flight statuses and generate notifications.
- Rule-based chatbot for contextual assistance.
- Data seeding for demo scenarios and recovery flows.

---

## 🚀 Installation & Setup

1. Create and activate a Python virtual environment.
2. Install dependencies: `pip install -r requirements.txt`.
3. Optionally create a `.env` with `MONGO_URI`.
4. Start: `python app.py` (defaults to `127.0.0.1:5000`).

---

## ▶️ Running the Project

```bash
python app.py
```

Open `http://127.0.0.1:5000` (API base).

---

## 📦 Production Build

Use a WSGI server (Gunicorn) and reverse proxy for production. Example:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Containerize with Docker for portability.

---

## 🌐 Deployment

- Deploy to Heroku / Render / Railway or container platforms. Set `MONGO_URI` environment variable for production DB.

---

## 🔐 Authentication Flow

- Demo auth: `login_user_legacy` accepts email/password and returns a user object; admin middleware `require_admin` protects admin routes.
- For production: replace with JWT or session-based auth and secure admin credentials.

---

## 🤖 AI Chatbot

- `/api/chat` is a rule-based bot that returns `reply` and `options` for UI quick actions.
- Can be replaced by an LLM; keep same input/output contract for compatibility.

---

## 📊 Architecture Overview

- Flask REST API + MongoDB storing collections: `flights`, `bookings`, `notifications`, `users`, `refunds`, `rebookings`.
- Frontend (Vite/React) calls APIs for all interactive flows. Admin endpoints support simulation and stats.

---

## 📋 Assumptions

- Demo-focused: not production hardened.
- Notifications are simulated documents rather than real outbound messages.
- Payments are mocked; card fields are non-sensitive placeholders.

---

## ⚖️ Trade-offs

- Simplicity and developer experience prioritized over production security and scaling.
- Single MongoDB offers flexibility but lacks strong relational constraints.
- Rule-based chatbot keeps complexity low at the expense of natural language understanding.

---

## 🔮 Future Enhancements

- Add OpenAPI (Swagger) documentation.
- Provide a Postman collection and automated integration tests.
- Add JWT-based auth and RBAC for admin flows.
- Integrate real transactional email/SMS providers.
- Replace chatbot with LLM-backed intent handling.
