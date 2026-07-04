# 🛴 SecureRide

**A secure peer-to-peer marketplace for verified micromobility vehicles.**

SecureRide is a full-stack web application that enables users to safely buy, sell, and trade verified electric scooters, bicycles, and electric bicycles. Every vehicle is registered with its frame number and linked to a verified owner - reducing fraud, preventing stolen vehicle sales, and building trust between buyers and sellers.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technologies Used](#-technologies-used)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Routes](#-api-routes)
- [Screenshots](#-screenshots)
- [Authors](#-authors)

---

## 🔍 Project Overview

The micromobility market is growing rapidly, but buying and selling used electric scooters and bikes online comes with risks - stolen vehicles, fraudulent sellers, and no way to verify ownership. **SecureRide** solves this by combining a modern marketplace with a built-in ownership verification system.

The project was developed as a final-year Computer Science capstone project with a strong emphasis on secure ownership verification, fraud prevention, and user trust.

### How It Works

```
Register & Verify Identity ➜ Register Your Vehicle ➜ List It for Sale ➜ Trade Safely
```

1. **Users register** with their national ID number and upload an ID card image (encrypted at rest).
2. **Admins review** and approve each registration before the user gains access.
3. **Vehicle owners** register their vehicles using the frame number and vehicle details. The vehicle is automatically linked to the authenticated user's verified identity.
4. **Sellers** create marketplace listings for their verified vehicles.
5. **Buyers** browse listings, chat with sellers, and initiate trades.
6. **Trades** follow a structured flow: buyer requests → seller accepts → both parties confirm. Upon completion, vehicle ownership automatically transfers to the buyer and appears in their My Vehicles dashboard. Completed trade details are permanently preserved in the buyer's and seller's trade history.

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
- Owners can **delete registered vehicles** — blocked only if the vehicle has an active listing or an active pending/accepted trade

### 🛒 Marketplace

- Create, edit, and delete vehicle listings with photos, pricing, and location
- Browse and filter listings by vehicle type, condition, price range, and keyword search
- Personalized **"Recommended for You"** section powered by the matching algorithm
- One active listing per vehicle to prevent duplicates

### 🤝 Secure Trading

- Structured trade flow: buyer requests → seller accepts/rejects → mutual confirmation
- **Dual confirmation** — both seller and buyer must confirm the trade happened
- Automatic **ownership transfer** upon trade completion — purchased vehicle immediately appears in the buyer's My Vehicles dashboard
- Option to **abort** a trade if it did not go through
- **Trade history snapshot** — vehicle details (brand, model, type, color) are permanently stored in the trade record at completion time, so Buy/Sale History remains accurate even if the vehicle is later deleted

### 👤 Profile Dashboard

- Edit **account details** - update email address and password with current-password verification
- **My Vehicles** - search, paginate, toggle stolen status, and delete registered vehicles
- **My Listings** - view and delete active marketplace listings
- **Trade History** - unified view of active trades plus separate Buy History and Sale History sections with full vehicle and counterparty details

### 💬 In-App Chat

- Messaging between buyers and sellers per listing
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
| **Tailwind CSS** (via CDN) | Utility-first styling |
| **Material Symbols** (via CDN) | Icon system |
| **Inter** (via Google Fonts) | UI font |
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

---

## 🏗️ System Architecture

![Architecture Diagram](docs/images/architecture-diagram.png)
---

## 📁 Project Structure

```
secureRide/
│
├── src/                              # React Frontend
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Routes & global layout
│   ├── index.css                     # Global styles
│   ├── context/
│   │   └── AuthContext.jsx           # Global auth state (user, login/logout, modals)
│   ├── pages/
│   │   ├── LandingPage.jsx           # Home / marketing page
│   │   ├── BuyPage.jsx               # Marketplace with recommendations
│   │   ├── SellPage.jsx              # Create listings
│   │   ├── ListingDetailPage.jsx     # Listing view, edit, trade, chat
│   │   ├── VerifyOwnership.jsx       # Vehicle registration
│   │   ├── ProfilePage.jsx           # Account, vehicles & trade history
│   │   ├── AdminPage.jsx             # Admin dashboard
│   │   └── AboutPage.jsx             # About the project
│   ├── components/
│   │   ├── LoginModal.jsx            # Login with resubmission flow
│   │   ├── RegisterModal.jsx         # Registration with ID upload
│   │   ├── ChatWidget.jsx            # Global chat overlay
│   │   ├── NotificationBell.jsx      # Unread message alerts
│   │   ├── BlockedBanner.jsx         # Blocked account notice
│   │   ├── about/                    # About page section components
│   │   ├── admin/                    # Admin panel components
│   │   ├── auth/                     # Login & registration forms
│   │   ├── buy/                      # Marketplace filter components
│   │   ├── chat/                     # Chat conversation views
│   │   ├── landing/                  # Landing page sections
│   │   ├── listing/                  # Listing detail components
│   │   ├── listings/                 # Listing cards
│   │   ├── profile/                  # Profile section components
│   │   ├── sell/                     # Sell flow step components
│   │   ├── trades/                   # Trade card components
│   │   ├── ui/                       # Shared UI (PageHeader, PageFooter, DetailRow, EmptyState, etc.)
│   │   └── verify/                   # Vehicle registration step components
│   └── utils/
│       ├── api.js                    # Centralized fetch client (auth, error handling)
│       ├── auth.js                   # Auth helper utilities
│       ├── constants.js              # Shared constants (VEHICLE_ICONS, inputCls variants)
│       └── chatFormatters.js         # Chat message formatting
│
├── backend/                          # FastAPI Backend
│   ├── main.py                       # App setup, CORS, routers
│   ├── database.py                   # DB engine, sessions, table creation
│   ├── models.py                     # SQLAlchemy ORM models
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── serializers.py                # Shared listing serialization helpers
│   ├── encryption.py                 # Fernet encrypt/decrypt utilities
│   ├── migrations.py                 # Schema migration helpers
│   ├── requirements.txt              # Python dependencies
│   └── routes/
│       ├── auth.py                   # Register, login, profile updates
│       ├── verify.py                 # Vehicle registration & deletion
│       ├── sell.py                   # Listing CRUD & available vehicles
│       ├── trade.py                  # Trade lifecycle management
│       ├── chat.py                   # Conversations & messages
│       ├── admin.py                  # Admin moderation endpoints
│       └── recommendations.py        # Matching algorithm engine
│
├── docs/
│   └── images/                       # Screenshots & architecture diagrams
├── index.html                        # HTML shell + Tailwind CDN config
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite config with API proxy
└── eslint.config.js                  # ESLint configuration
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

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create a .env file (see Environment Variables section)
cp .env.example .env

# Start the backend server
uvicorn main:app --reload --port 8001
```

The API will be available at `http://localhost:8001`.

> **Database:** Tables are created automatically on first startup — no manual migration step is needed.

### Frontend Setup

```bash
# From the project root
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (Vite may auto-increment the port if 5173 is already in use).

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory (or copy from `.env.example`):

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg format) | Yes |
| `SECRET_KEY` | Secret key for JWT token signing | Yes |
| `ID_CARD_ENCRYPTION_KEY` | Fernet key for ID card image encryption | Yes |

Example `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname?sslmode=require
SECRET_KEY=your-random-secret-key
ID_CARD_ENCRYPTION_KEY=your-fernet-key-here
```

To generate a valid `ID_CARD_ENCRYPTION_KEY`, run:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 🔌 API Routes

All routes are prefixed with `/api` and served by the FastAPI backend.

| Prefix | Description |
|---|---|
| `/api/auth` | Registration, login, profile management |
| `/api/verify` | Vehicle registration, deletion, and stolen flag |
| `/api/sell` | Listing CRUD and available vehicles |
| `/api/trades` | Trade lifecycle (request, accept/reject, cancel, abort, confirm-transfer, confirm-receipt) |
| `/api/chat` | Conversations and messages |
| `/api/admin` | Admin moderation and user management |
| `/api/recommendations` | Personalized listing recommendations |
| `/api/health` | Health check |
| `/api/stats` | Platform statistics (total verified vehicles) |

Interactive API documentation is available at `http://localhost:8001/docs` (Swagger UI) when the backend is running.

---


## 📸 Screenshots

The following screenshots demonstrate the main features and user flow of SecureRide.

### 🏠 Landing Page

The application's home page introducing SecureRide and its secure vehicle marketplace.

![Landing Page](docs/images/landing-page.png)

---

### 🛒 Marketplace

Browse verified vehicle listings with personalized recommendations, filters, and search functionality.

![Marketplace](docs/images/marketplace.png)

---

### 📄 Listing Details

Detailed listing view including vehicle information, seller details, image gallery, chat, and trade actions.

![Listing Details](docs/images/listing-details.png)

---

### 👤 Profile Page

Personal dashboard where users can edit account details, manage registered vehicles (search, toggle stolen, delete), view active listings, and browse complete Buy and Sale trade history.

![Profile Page](docs/images/profile-page.png)

---

### 💬 Chat System

Built-in messaging system enabling secure communication between buyers, sellers, and administrators.

![Chat System](docs/images/chat-system.png)

---

### 🛡️ Admin Dashboard

Administrative dashboard for reviewing registrations, approving users, managing blocked accounts, and moderating the platform.

![Admin Dashboard](docs/images/admin-dashboard.png)

---

## 👥 Authors

| | Name | Role |
|---|---|---|
| 👤 | **Ido Ben Bassat** | Frontend Development |
| 👤 | **Etay Zerachowitz** | Backend Development |

---

<div align="center">

Built with ❤️ as a Final Year Project

**SecureRide** - Trade with confidence.

</div>
