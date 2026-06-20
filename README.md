# IU-Pay — Digital Banking Application

A full-stack digital banking platform built with **FastAPI** (backend) and **React Native / Expo** (frontend). Supports account management, fund transfers, bill payments, card management, transaction receipts, and beneficiary management.

---

## Architecture

```
banking-app/
├── backend/              # FastAPI + SQLAlchemy
│   ├── .env              # Environment configuration
│   ├── main.py           # ASGI entry point
│   └── app/
│       ├── api/          # Route handlers (auth, accounts, transactions, cards, etc.)
│       ├── models/       # SQLAlchemy ORM models
│       ├── schemas/      # Pydantic request/response schemas
│       └── utils/        # JWT, password hashing, number generators
│
└── frontend-new/         # React Native (Expo) + TypeScript
    ├── app/              # Expo Router screens
    ├── store/            # Zustand auth state
    ├── lib/              # Axios HTTP client
    └── hooks/            # Custom React hooks
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10+** | Runtime |
| **FastAPI** | REST API framework |
| **SQLAlchemy 2.0** | ORM (SQLite / PostgreSQL) |
| **JWT (python-jose)** | Token-based authentication |
| **passlib (bcrypt)** | Password hashing |
| **ReportLab** | PDF receipt generation |

### Frontend
| Technology | Purpose |
|---|---|
| **React Native 0.74** | Mobile framework |
| **Expo ~51** | Build toolchain + SDK |
| **Expo Router** | File-based navigation |
| **React Native Paper** | Material Design UI components |
| **TanStack React Query** | Server state & caching |
| **Zustand** | Client state management |
| **React Hook Form** | Form validation |
| **Axios** | HTTP client with auto token refresh |

---

## Features

### User & Authentication
- Email/password registration & login
- JWT access + refresh token authentication
- Persistent session across app restarts
- Automatic token refresh on expiry

### Accounts
- Multiple account types: Savings, Current, Student
- Auto-generated account number, IBAN, branch code
- Deposit and withdrawal operations

### Transactions
- **Transfer** – Send money to any account
- **Bill Payment** – Electricity, gas, water, internet, phone, insurance, tuition
- **Ticket Booking** – Event ticket purchase
- Real-time balance update after every transaction

### Cards
- Create virtual & physical cards
- Freeze / unfreeze cards
- Delete cards

### Beneficiaries
- Save frequent recipients with account number & bank name
- Quick transfer to saved beneficiaries

### Notifications
- In-app notification on payment sent / received
- Unread notification badge on home screen

### Documents
- PDF receipt download for each transaction
- Account statement PDF (1 week to 6 years)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login |
| POST | `/api/auth/refresh` | ✓ | Refresh tokens |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/auth/session-config` | ✗ | Session timeout settings |
| GET | `/api/accounts` | ✓ | List accounts |
| POST | `/api/accounts` | ✓ | Create account |
| POST | `/api/accounts/{id}/deposit` | ✓ | Deposit |
| POST | `/api/accounts/{id}/withdraw` | ✓ | Withdraw |
| POST | `/api/transactions/transfer` | ✓ | Transfer money |
| POST | `/api/transactions/bill-payment` | ✓ | Pay bill |
| GET | `/api/transactions` | ✓ | Transaction history |
| GET | `/api/transactions/receipt/{id}` | ✓ | PDF receipt |
| GET | `/api/transactions/statement` | ✓ | PDF statement |
| GET | `/api/transactions/dashboard/stats` | ✓ | Dashboard data |
| GET | `/api/cards` | ✓ | List cards |
| POST | `/api/cards` | ✓ | Create card |
| DELETE | `/api/cards/{id}` | ✓ | Delete card |
| POST | `/api/cards/{id}/freeze` | ✓ | Freeze card |
| POST | `/api/cards/{id}/unfreeze` | ✓ | Unfreeze card |
| GET | `/api/beneficiaries` | ✓ | List beneficiaries |
| POST | `/api/beneficiaries` | ✓ | Add beneficiary |
| DELETE | `/api/beneficiaries/{id}` | ✓ | Remove beneficiary |
| GET | `/api/notifications` | ✓ | List notifications |
| PUT | `/api/notifications/{id}/read` | ✓ | Mark notification read |

Full interactive API docs at: `http://localhost:8000/docs`

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend-new

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go (mobile) or press `w` for web browser.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./banking_app.db` | Database connection string |
| `SECRET_KEY` | — | JWT signing secret (change in production) |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `365` | Refresh token lifetime |
| `SESSION_TIMEOUT_MINUTES` | `1440` | Frontend idle timeout |

---

## Database

The app uses **SQLAlchemy** with SQLite by default. For production, switch to **PostgreSQL** by updating `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/iupay
```

Models auto-create on first run (`Base.metadata.create_all`).

### Key Models
- **User** – Authentication + profile
- **Account** – Banking accounts with `available_balance` and `ledger_balance`
- **Transaction** – Debit/credit records linked to sender & beneficiary
- **Card** – Virtual or physical debit cards
- **Beneficiary** – Saved recipient accounts
- **Notification** – In-app alerts

---

## Security

- Passwords hashed with **bcrypt** via passlib
- JWT tokens signed with **HS256**
- Refresh token rotation on every token refresh
- Token in `Authorization: Bearer` header (query param fallback for PDFs)
- Session auto-expiry on inactivity (configurable)

---

## Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Email + password authentication |
| Home (Dashboard) | Balance, quick actions, recent transactions |
| Accounts | View, deposit, withdraw from accounts |
| Cards | Manage virtual & physical cards |
| History | Full transaction log with PDF receipts |
| Transfer | Send money to any account |
| Bill Payment | Pay utility bills |
| Ticket Booking | Book event tickets |
| Beneficiaries | Manage saved recipients |
| Profile | User info & logout |
| Notifications | In-app alerts |
| Statement | Download account statement PDF |

---

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Muhammad Moiz Ahmed

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
