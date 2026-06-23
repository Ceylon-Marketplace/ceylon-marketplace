# Ceylon Marketplace

Subscription-driven marketplace with real-time auctions.

**Stack:** Next.js 15 · Prisma · PostgreSQL · Redis

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 20
- npm or pnpm
- Docker (for PostgreSQL + Redis)

### 2. Clone & Install

```bash
git clone <repo>
cd ceylon-marketplace
cp .env.example .env
npm install
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Project Structure

```
ceylon-marketplace/
├── src/
│   ├── app/              Next.js 15 App Router
│   │   ├── (admin)/      Admin pages
│   │   ├── (auth)/       Login & registration
│   │   ├── (main)/       Main application pages
│   │   └── api/          API routes (38 endpoints)
│   ├── components/       Reusable components
│   ├── lib/              Utilities & helpers
│   └── store/            Zustand state management
├── prisma/               Database schema & migrations
├── public/               Static assets
└── docker-compose.yml    Infrastructure definition
```

## Features

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Implemented |
| Listings Management | ✅ Implemented |
| Real-time Auctions | ✅ Implemented |
| Messaging | ✅ Implemented |
| Subscriptions | ✅ Implemented |
| Admin Panel | ✅ Implemented |
| Reviews & Ratings | ✅ Implemented |

## API Modules

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `GET /me` |
| Listings | `GET/POST /api/listings`, `GET /api/listings/:id` |
| Auctions | `GET/POST /api/auctions`, WebSocket support |
| Messaging | `GET/POST /api/conversations`, WebSocket support |
| Subscriptions | `GET /api/subscriptions/plans`, `POST .../subscribe` |
| Admin | `GET /api/admin/stats`, pending listings, user management |
| Reports | `POST /api/reports`, `GET /api/reports` (admin) |
| Notifications | `GET /api/notifications`, mark read |

## Key Business Rules Implemented

- Listing title: 10–120 chars · max 20 images · max 3 videos · duplicate check
- Subscription gate: expired subscription blocks new listing creation
- Auction: seller cannot self-bid · only higher bids accepted · reserve price hidden
- Anti-sniping: bid in last 2 min → auction extended by 2 min
- Message history immutable; block user prevents messaging
- Admin approval workflow for listings (PENDING_REVIEW → ACTIVE/REJECTED)

