# 🅿️ VoidPark — Backend API

Smart Urban Parking Management System — Backend API Server

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **PostgreSQL + PostGIS** | Database with geospatial queries |
| **Firebase Admin SDK** | Authentication (token verification) |
| **Socket.IO** | Real-time slot availability updates |
| **Zod** | Request validation |

---

## 📁 Project Structure

```
VoidPark/
├── backend/
│   ├── .env                          ← Your secrets (not committed)
│   ├── .env.example                  ← Template reference
│   ├── .gitignore
│   ├── package.json
│   ├── firebase-service-account.json ← Firebase Admin key (not committed)
│   └── src/
│       ├── server.js                 ← Entry point
│       ├── config/
│       │   ├── index.js              ← Environment config loader
│       │   ├── database.js           ← PostgreSQL pool + transaction helper
│       │   └── firebase.js           ← Firebase Admin SDK init
│       ├── database/
│       │   ├── migrate.js            ← Schema creation
│       │   └── seed.js               ← Sample dev data
│       ├── middleware/
│       │   ├── auth.js               ← Firebase token verification
│       │   ├── errorHandler.js       ← Global error formatting
│       │   └── validate.js           ← Zod validation middleware
│       ├── models/
│       │   └── schemas.js            ← All Zod validation schemas
│       ├── services/
│       │   ├── userService.js        ← User CRUD + account deletion
│       │   ├── parkingService.js     ← Parking CRUD + geospatial
│       │   └── bookingService.js     ← Booking lifecycle management
│       ├── controllers/
│       │   ├── userController.js
│       │   ├── parkingController.js
│       │   └── bookingController.js
│       ├── routes/
│       │   ├── index.js              ← Route aggregator
│       │   ├── userRoutes.js
│       │   ├── parkingRoutes.js
│       │   └── bookingRoutes.js
│       └── sockets/
│           └── socketHandler.js      ← Real-time events
└── frontend/                         ← (Future)
    ├── .env
    └── .env.example
```

---

## ⚡ Quick Start

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and fill in your values
# 3. Place firebase-service-account.json in backend/

# 4. Create database and run migration
npm run db:migrate

# 5. (Optional) Seed sample data
npm run db:seed

# 6. Start dev server
npm run dev
```

---

## 🔗 API Endpoints

**Base URL:** `http://localhost:5000/api/v1`

### 👤 Users
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users/register` | Register user in local DB |
| `GET` | `/users/me` | Get profile (detects new user) |
| `PUT` | `/users/me` | Update profile |
| `DELETE` | `/users/me` | Delete account (cascading) |

### 🅿️ Parking Spaces
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/parking/nearby?lat=..&lng=..` | All parking sorted by distance (nearest first) |
| `GET` | `/parking/search?query=..` | Search by place name / address |
| `GET` | `/parking/my` | Owner's own parking spaces |
| `POST` | `/parking` | Create parking space |
| `GET` | `/parking/:id` | Get details + slot statuses |
| `PUT` | `/parking/:id` | Update (owner only, can toggle is_active) |
| `DELETE` | `/parking/:id` | Delete (owner only, no active bookings) |

### 📋 Bookings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bookings` | Book a slot (confirmed immediately, no payment gateway) |
| `GET` | `/bookings/my` | User's own bookings (with owner contact info) |
| `GET` | `/bookings/owner` | Bookings on owner's spaces (with user details) |
| `GET` | `/bookings/:id` | Booking details |
| `POST` | `/bookings/:id/cancel` | User cancels their booking |
| `POST` | `/bookings/:id/owner-cancel` | Owner cancels a booking on their space |
| `PUT` | `/bookings/:id/end` | End open-ended booking (sets end time, calculates amount) |

---

## 📋 Booking Flow

1. **User books a slot** → `POST /bookings`
   - Provides: `parkingId`, `vehicleType`, `startTime`, optionally `endTime`
   - If `endTime` provided → total amount is calculated immediately
   - If `endTime` is null → open-ended booking at hourly rate
   - Booking is **confirmed instantly** (no payment gateway)
   - User pays owner directly (offline, by contacting them)

2. **Owner sees booking** → `GET /bookings/owner`
   - Shows: user name, phone, vehicle type, slot number, times, amount

3. **User ends open-ended booking** → `PUT /bookings/:id/end`
   - Provides actual `endTime`
   - Final amount is calculated automatically

4. **Either party can cancel** → `/cancel` or `/owner-cancel`

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `subscribeToDashboard` | *(none)* | Join dashboard room |
| `unsubscribeFromDashboard` | *(none)* | Leave dashboard room |
| `subscribeToParkingSpace` | `parkingId` | Join specific parking room |
| `unsubscribeFromParkingSpace` | `parkingId` | Leave specific parking room |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `slotBooked` | `{ parkingId, slotId, ... }` | A slot was booked |
| `slotReleased` | `{ parkingId, slotId }` | A slot was released (cancel/end) |
| `parkingUpdated` | `{ type, parkingId }` | Parking space created/updated/deleted |

---

## 🔒 Security

- **Firebase Authentication** — All endpoints require valid Firebase ID token
- **Server-side pricing** — Amount calculated from DB, never from frontend
- **Row-level locking** — Prevents double-booking race conditions
- **Input validation** — Zod schemas on all endpoints
- **Helmet** — Security headers
- **CORS** — Configured allowed origins

---

## 🛢️ Database

PostgreSQL with PostGIS extension. Key tables:

- **users** — Firebase UID linked to local profile
- **parking_spaces** — Location (geography), pricing per vehicle type, active toggle
- **parking_slots** — Individual slots per parking space
- **bookings** — Slot reservations with optional end time, hourly rate, status tracking
