# ✈️ SkyJet Airways
> An Airline Disruption Recovery Platform that enables passengers to manage flight delays, cancellations, rebooking, refunds, booking retrieval, and travel updates through a self-service digital portal.

![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)
![Express.js](https://img.shields.io/badge/Express.js-REST_API-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)

---

# 📌 About The Project

SkyJet Airways is a self-service Airline Disruption Recovery Platform designed to help passengers manage flight disruptions without contacting customer support. The platform provides real-time flight updates, booking management, automated recovery options, and an intuitive dashboard for both passengers and airline administrators.

The system combines modern web technologies, REST APIs, and cloud-ready architecture to deliver a seamless digital experience during weather disruptions, flight delays, and cancellations.

The platform supports:

- ✈️ Flight Booking
- 🔍 Booking Retrieval
- 📋 My Trips Dashboard
- 🔄 Flight Rebooking
- ❌ Flight Cancellation
- 💰 Refund Request
- 📄 Ticket & Cancellation PDF Generation
- 🔔 Real-time Notifications
- 📊 Admin Dashboard
- 🌍 Domestic & International Flight Management

SkyJet Airways helps airlines reduce customer support workload while improving passenger satisfaction through digital self-service recovery.

---
# Zip File Link to Direct Access
https://drive.google.com/drive/folders/1Wqv-Ip1shIsAAJYa-PHBKsPtEZSaJpxe?usp=drive_link
# ✨ Key Features

## ✈️ Flight Booking

- Search available flights
- Domestic & International flights
- Live seat availability
- Instant booking confirmation
- Booking reference generation

---

## 🔍 Booking Retrieval

- Retrieve booking using PNR
- View passenger details
- Flight information
- Boarding status
- Download ticket PDF

---

## 📋 My Trips

- View upcoming trips
- Active bookings
- Cancelled bookings
- Completed journeys
- Flight status tracking

---

## 🔄 Flight Rebooking

- Alternative flight suggestions
- Same route prioritization
- Connecting flight recommendations
- Domestic & International recovery logic
- Automatic booking update

---

## ❌ Flight Cancellation

- Cancel existing bookings
- Cancellation confirmation
- Cancellation receipt generation
- Refund eligibility checking

---

## 💰 Refund Management

- Refund request submission
- Refund eligibility verification
- Refund status tracking
- Refund confirmation receipt

---

## 🔔 Smart Notifications

- Booking confirmation
- Flight delay alerts
- Flight cancellation alerts
- Boarding reminders
- Gate change notifications
- Refund approval notifications
- Rebooking confirmation

---

## 📄 PDF Generation

- Flight Ticket PDF
- Boarding Pass PDF
- Cancellation Receipt
- Refund Receipt

---

## 🌍 Domestic & International Flight Support

# Domestic Flights

- Fast boarding process
- Domestic terminal information
- Free rebooking (airline cancellation)
- Standard refund policy

# International Flights

- Passport reminder
- Visa information
- International terminal
- Travel document verification reminder
- International rebooking policy

---

## 👨‍✈️ Admin Dashboard

- Flight Management
- Passenger Management
- Booking Management
- Refund Management
- Rebooking Requests
- Flight Status Updates
- Live Operations Dashboard
- Analytics & Reports

---

# 🛠️ Technology Stack

## Frontend

- React.js
- TypeScript
- HTML5
- CSS3
- Tailwind CSS
- JavaScript

---

## Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication

---

## Database

- MongoDB

---

## Core Modules

- Flight Management
- Booking Management
- Recovery Engine
- Notification System
- PDF Generator
- Admin Dashboard

---

## External Services

- Mock Flight APIs
- Email Notification Service
- SMS Notification Service
- PDF Generation Library

---

# ✈️ Passenger Workflow

- Search Flights
- Book Flight
- Retrieve Booking
- View My Trips
- Track Flight Status
- Cancel Booking
- Rebook Flight
- Request Refund
- Download Ticket PDF
- Receive Notifications

---

# 👨‍✈️ Admin Workflow

- Login
- Manage Flights
- Update Flight Status
- Manage Bookings
- Manage Passengers
- Approve Refund Requests
- Manage Rebooking Requests
- View Analytics
- Monitor Flight Operations

---

# 🌍 Flight Network

## Domestic Cities

- Ahmedabad
- Delhi
- Mumbai
- Bengaluru
- Chennai
- Hyderabad
- Kolkata
- Pune
- Goa
- Jaipur

---

## International Cities

- Singapore
- Tokyo
- Dubai
- Bangkok
- Kuala Lumpur
- Seoul
- Hong Kong
- Jakarta
- Bali
- Manila
- Doha
- Abu Dhabi
- Taipei
- Hanoi

---

# 🔒 Security Features

- JWT Authentication
- Protected Routes
- Role-Based Access Control
- Secure API Communication
- Input Validation
- Error Handling

---

# 📈 Dashboard Analytics

| Module | Description |
|----------|-------------|
| Total Flights | Active & Scheduled Flights |
| Total Bookings | Customer Bookings |
| Active Passengers | Current Travelers |
| Delayed Flights | Flights Delayed |
| Cancelled Flights | Cancelled Operations |
| Refund Requests | Pending & Approved Refunds |
| Rebooking Requests | Recovery Requests |
| Revenue Dashboard | Booking Revenue |

---
# 🚀 Installation & Setup

Follow these steps to run the SkyJet Airways project locally.

---

# 📦 Prerequisites

Make sure the following software is installed on your system.

| Software | Version |
|----------|---------|
| Node.js | v18+ |
| npm | Latest |
| Python | 3.10+ |
| MongoDB Community Server | Latest |
| Git | Latest |

Verify installation:

```bash
node -v
npm -v
python --version
mongod --version
git --version
```

---

# 📥 Clone Repository

```bash
git clone https://github.com/your-username/skyjet-airways.git

cd skyjet-airways
```

---

# 📁 Project Structure

```
skyjet-airways/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app.py
│   ├── bootstrap.py
│   ├── skyjet_data.py
│   ├── requirements.txt
│   └── .env
│
├── README.md
└── .gitignore
```

---

# 💻 Frontend Setup

Move into the frontend folder

```bash
cd frontend
```

Install all dependencies

```bash
npm install
```

If needed, install Vite globally

```bash
npm install -g vite
```

Start the frontend

```bash
npm run dev
```

The frontend will be available at

```
http://localhost:5173
```

---

# 📦 Frontend Dependencies

Install manually if required.

```bash
npm install react
npm install react-dom
npm install react-router-dom
npm install axios
npm install tailwindcss
npm install @tailwindcss/vite
npm install lucide-react
npm install react-icons
npm install chart.js
npm install react-chartjs-2
npm install jspdf
npm install html2canvas
```

Or simply run

```bash
npm install
```

---

# ⚙️ Backend Setup

Open another terminal

```bash
cd backend
```

Create Virtual Environment

### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv

source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

If requirements.txt is unavailable

```bash
pip install Flask
pip install Flask-Cors
pip install pymongo
pip install python-dotenv
pip install requests
pip install Werkzeug
```

Start Flask Server

```bash
python app.py
```

Backend runs on

```
http://127.0.0.1:5000
```

---

# 🍃 MongoDB Setup

Install MongoDB Community Edition.

Start MongoDB

## Windows

```bash
net start MongoDB
```

## macOS

```bash
brew services start mongodb-community
```

MongoDB should run on

```
mongodb://localhost:27017
```

---

# 🔑 Environment Variables

Create a file named

```
backend/.env
```

Add

```env
MONGO_URI=mongodb://localhost:27017/
DATABASE_NAME=skyjet
SECRET_KEY=skyjet_secret_key
FLASK_ENV=development
FLASK_DEBUG=True
```

---

# ▶️ Running the Complete Project

## Terminal 1

```bash
cd backend

python app.py
```

## Terminal 2

```bash
cd frontend

npm install

npm run dev
```

Open the application

Frontend

```
http://localhost:5173
```

Backend

```
http://127.0.0.1:5000
```

---

# 📜 Available Scripts

## Frontend

```bash
npm install
```

Install dependencies

```bash
npm run dev
```

Start development server

```bash
npm run build
```

Create production build

```bash
npm run preview
```

Preview production build

---

## Backend

```bash
pip install -r requirements.txt
```

Install dependencies

```bash
python app.py
```

Run Flask Server

Database seeding happens automatically on first run.

---

# 📦 requirements.txt

```text
Flask
Flask-Cors
pymongo
python-dotenv
requests
Werkzeug
```

---

# 📦 package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

# ✅ Demo Credentials

| Field | Value |
|-------|-------|
| Booking ID | SJ987 |
| First Name | Sid |
| Last Name | Patel |
| Email | sid.patel@example.com |

---



# 🛠 Troubleshooting

## MongoDB Connection Error

Make sure MongoDB is running:

```bash
mongosh
```

---

## Port Already in Use

Kill the process using the occupied port or change the port number in the backend configuration.

---

## Module Not Found

Reinstall dependencies:

```bash
npm install
```

or

```bash
pip install -r requirements.txt
```

---

# 🎉 Project 

After completing the above steps, the application will be available at:

**Frontend:** http://localhost:5173

**Backend:** http://127.0.0.1:5000

Enjoy using **SkyJet – Airline Disruption Recovery Portal**! ✈️


# 🎯 Project Highlights

- Self-Service Airline Recovery Portal
- Customer & Admin Dashboards
- Domestic & International Flight Support
- Automated Rebooking & Refund Workflow
- Ticket & Cancellation PDF Generation
- Real-Time Flight Status Updates
- Responsive UI with Modern Design
- REST API Based Architecture
- Secure Authentication & Authorization
- Scalable and Cloud-Ready MVP
