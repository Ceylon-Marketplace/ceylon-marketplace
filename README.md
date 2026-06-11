# Ceylon Marketplace

Subscription-driven marketplace with real-time auctions.

**Stack:** Next.js 15 · NestJS · PostgreSQL · Prisma · Redis · Socket.IO

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for PostgreSQL + Redis)

### 2. Clone & Install

```bash
cd ceylon-marketplace
cp .env.example .env
pnpm install
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

### 4. Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
cd packages/database
npx prisma migrate dev --name init

# Seed (plans, categories, admin user)
npx ts-node prisma/seed.ts
```

Default admin: `admin@ceylon.lk` / `Admin@123!`

### 5. Run

```bash
# From monorepo root — starts both apps
pnpm dev
```

| Service | URL |
|---|---|
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001/api |

---

## Project Structure

```
ceylon-marketplace/
├── apps/
│   ├── api/          NestJS backend
│   └── web/          Next.js 15 frontend
├── packages/
│   └── database/     Prisma schema + client
├── docker-compose.yml
└── .env.example
```

## API Modules

| Module | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `GET /me` |
| Listings | `GET/POST /api/listings`, `GET /api/listings/:id` |
| Auctions | `GET/POST /api/auctions`, WebSocket `/auctions` |
| Messaging | `GET/POST /api/conversations`, WebSocket `/messaging` |
| Subscriptions | `GET /api/subscriptions/plans`, `POST .../subscribe` |
| Admin | `GET /api/admin/stats`, pending listings, user management |
| Reports | `POST /api/reports`, `GET /api/reports` (admin) |
| Notifications | `GET /api/notifications`, mark read |

## Key Business Rules Implemented

- Listing title: 10–120 chars · max 20 images · max 3 videos · duplicate check
- Subscription gate: expired subscription blocks new listing creation; existing listings survive grace period
- Auction: seller cannot self-bid · only higher bids accepted · reserve price hidden
- Anti-sniping: bid in last 2 min → auction extended by 2 min
- Bidder names masked in auction feed
- Message history immutable; block user prevents messaging
- Admin approval workflow for listings (PENDING_REVIEW → ACTIVE/REJECTED)
