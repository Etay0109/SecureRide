# 🛴 SecureRide

**A peer-to-peer marketplace for verified micromobility vehicles.**

SecureRide is a full-stack web application that enables users to safely buy, sell, and trade verified electric scooters, bicycles, and electric bicycles. Every vehicle is registered with its frame number and linked to a verified owner - reducing fraud, preventing stolen vehicle sales, and building trust between buyers and sellers.


---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [License](#-license)
- [Authors](#-authors)

---

## 🔍 Project Overview

The micromobility market is growing rapidly, but buying and selling used electric scooters and bikes online comes with risks - stolen vehicles, fraudulent sellers, and no way to verify ownership. **SecureRide** solves this by combining a modern marketplace with a built-in ownership verification system.

### How It Works

```
Register & Verify Identity ➜ Register Your Vehicle ➜ List It for Sale ➜ Trade Safely
```

1. **Users register** with their national ID number and upload an ID card image (encrypted at rest).
2. **Admins review** and approve each registration before the user gains access.
3. **Vehicle owners** register their vehicles using the frame number and vehicle details. The vehicle is automatically linked to the authenticated user's verified identity.
4. **Sellers** create marketplace listings for their verified vehicles.
5. **Buyers** browse listings, chat with sellers, and initiate trades.
6. **Trades** follow a structured flow with mutual confirmation before ownership transfers.

### 🧠 Matching Algorithm

SecureRide includes a **content-based recommendation engine** that learns from user behavior. The algorithm:

- Tracks user interactions (views, chats, and trade requests) with configurable weights.
- Builds a **preference vector** for each user using one-hot encoded features (vehicle type, price band, city, condition).
- Ranks listings using **cosine similarity** between the user's preference profile and each listing's feature vector.
- Applies **feature weights** (vehicle type > price > city > condition) to prioritize the most relevant attributes.
- Handles the **cold start problem** by falling back to popularity-based recommendations for new users.

Each listing in the "Recommended for You" section displays a **Match Score** (0–100%) so users can see how well it fits their preferences.

---

## ✨ Features

### 🔐 Identity & Access

- User registration with **admin approval workflow** (pending → approved / rejected / changes requested)
- ID card image upload during registration with **Fernet encryption at rest** — images are deleted after admin review
- JWT-based authentication with protected routes
- Admin dashboard for managing registrations and blocked users

### 🏍️ Vehicle Ownership Verification

- Register vehicles by **frame number** (unique identifier)
- Link vehicles to verified user identities
- **Stolen vehicle registry** — owners can flag vehicles as stolen
- Anti-fraud protection: registering a stolen frame number **automatically blocks** the user

### 🛒 Marketplace

- Create, edit, and delete vehicle listings with photos, pricing, and location
- Browse and filter listings by vehicle type, condition, price range, and keyword search
- Personalized **"Recommended for You"** section powered by the matching algorithm
- One active listing per vehicle to prevent duplicates

### 🤝 Secure Trading

- Structured trade flow: buyer requests → seller accepts/rejects → mutual confirmation
- **Dual confirmation** — both seller and buyer must confirm the trade happened
- Automatic **ownership transfer** upon trade completion
- Option to **abort** a trade if it didn't happen

### 💬 Real-Time Chat

- In-app messaging between buyers and sellers per listing
- **Admin support chat** for moderation and user assistance
- Unread message notifications with read receipts
- Global chat widget accessible from any page

### 🛡️ Admin Panel

- Review pending registrations with decrypted ID card images
- **Approve**, **permanently block**, or **request changes** on registrations
- Manage blocked users with block/unblock controls
- Direct admin-to-user chat for investigations

---

## 🛠️ Technologies Used

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool and dev server |
| **React Router 7** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Material Symbols** | Icon system |
| **JavaScript (JSX)** | Language |

### Backend

| Technology | Purpose |
|---|---|
| **FastAPI** | Async REST API framework |
| **SQLAlchemy 2** (async) | ORM and database queries |
| **PostgreSQL** | Relational database (Neon cloud-compatible) |
| **asyncpg** | Async PostgreSQL driver |
| **Pydantic v2** | Request/response validation |
| **bcrypt** | Password hashing |
| **python-jose** | JWT token generation and verification |
| **cryptography (Fernet)** | ID card image encryption at rest |

### Architecture

```
┌─────────────────┐       /api proxy       ┌─────────────────┐       ┌──────────────┐
│   React SPA     │ ───────────────────►   │   FastAPI       │ ────► │  PostgreSQL  │
│   (Vite :5175)  │ ◄─────────────────     │   (Uvicorn      │ ◄──── │  (Neon)      │
│                 │      JSON responses     │    :8001)       │       │              │
└─────────────────┘                         └─────────────────┘       └──────────────┘
                                                    │
                                             ┌──────┴──────┐
                                             │  JWT Auth   │
                                             │  Fernet Enc │
                                             └─────────────┘
```

---

## 📁 Project Structure

```
secureRide/
│
├── src/                          # React Frontend
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Routes & global layout
│   ├── index.css                 # Global styles
│   ├── pages/
│   │   ├── LandingPage.jsx       # Home / marketing page
│   │   ├── BuyPage.jsx           # Marketplace with recommendations
│   │   ├── SellPage.jsx          # Create listings
│   │   ├── ListingDetailPage.jsx # Listing view, edit, trade, chat
│   │   ├── VerifyOwnership.jsx   # Vehicle registration
│   │   ├── ProfilePage.jsx       # User account & vehicles
│   │   ├── AdminPage.jsx         # Admin dashboard
│   │   └── AboutPage.jsx         # About the project
│   └── components/
│       ├── LoginModal.jsx        # Login with resubmission flow
│       ├── RegisterModal.jsx     # Registration with ID upload
│       ├── ChatWidget.jsx        # Global chat overlay
│       ├── NotificationBell.jsx  # Unread message alerts
│       └── BlockedBanner.jsx     # Blocked account notice
│
├── backend/                      # FastAPI Backend
│   ├── main.py                   # App setup, CORS, routers
│   ├── database.py               # DB engine, sessions, migrations
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── encryption.py             # Fernet encrypt/decrypt utilities
│   ├── requirements.txt          # Python dependencies
│   └── routes/
│       ├── auth.py               # Register, login, profile updates
│       ├── verify.py             # Vehicle registration & stolen flag
│       ├── sell.py               # Listing CRUD & available vehicles
│       ├── trade.py              # Trade lifecycle management
│       ├── chat.py               # Conversations & messages
│       ├── admin.py              # Admin moderation endpoints
│       └── recommendations.py    # Matching algorithm engine
│
├── index.html                    # HTML shell + Tailwind config
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite config with API proxy
└── eslint.config.js              # ESLint configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL** database (local or cloud, e.g. [Neon](https://neon.tech))

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create a .env file (see Environment Variables section)
cp .env.example .env

# Start the backend server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8001`.

### Frontend Setup

```bash
# From the project root
npm install
npm run dev
```

The app will be available at `http://localhost:5175`.

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg format) | Yes |
| `SECRET_KEY` | Secret key for JWT token signing | Yes |
| `ID_CARD_ENCRYPTION_KEY` | Fernet key for ID card image encryption | No (auto-generated in dev) |

Example:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname?sslmode=require
SECRET_KEY=your-random-secret-key
```

---

## 📄 License

This project was developed as a final year academic project and is intended for educational purposes.

---

## 👥 Authors

| | Name | Role |
|---|---|---|
| 👤 | **Ido Ben Bassat** | Frontend Development |
| 👤 | **Etay Zerahowitz** | Backend Development |

---

<div align="center">

Built with ❤️ as a Final Year Project

**SecureRide** - Trade with confidence.

</div>
