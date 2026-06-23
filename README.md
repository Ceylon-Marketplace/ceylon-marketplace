# Ceylon Marketplace

Subscription-driven marketplace with real-time auctions.

**Stack:** Next.js 15 · PostgreSQL (Supabase) · Prisma · Redis (Upstash) · Socket.IO

---

## Quick Start

### 1. Prerequisites

- Node.js ≥ 20

### 2. Clone & Install

```bash
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
```

### 3. Database

```bash
# Push schema to Supabase
npm run db:push

# Or run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### 4. Run

```bash
npm run dev
```

App available at <http://localhost:3000>

---

## Project Structure

```text
ceylon-marketplace/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/          Next.js App Router (routes, API handlers)
│   ├── components/   Shared UI components
│   ├── lib/          Prisma client, auth helpers, utilities
│   └── store/        Zustand stores
├── docker-compose.yml  Local Postgres + Redis (optional)
└── .env.example
```

## API Routes

| Route | Description |
| --- | --- |
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login |
| `POST /api/auth/refresh` | Refresh token |
| `GET /api/auth/me` | Current user |
| `GET/POST /api/listings` | Browse / create listings |
| `GET /api/listings/:id` | Listing detail |
| `GET/POST /api/auctions` | Browse / create auctions |
| `GET/POST /api/conversations` | Messaging |
| `GET /api/subscriptions/plans` | Subscription plans |
| `POST /api/subscriptions/subscribe` | Subscribe |
| `GET /api/admin/stats` | Admin stats |
| `GET/POST /api/reports` | Reports |
| `GET /api/notifications` | Notifications |

## Key Business Rules

- Listing title: 10–120 chars · max 20 images · max 3 videos · duplicate check
- Subscription gate: expired subscription blocks new listing creation; existing listings survive grace period
- Auction: seller cannot self-bid · only higher bids accepted · reserve price hidden
- Anti-sniping: bid in last 2 min → auction extended by 2 min
- Bidder names masked in auction feed
- Message history immutable; block user prevents messaging
- Admin approval workflow for listings (PENDING_REVIEW → ACTIVE/REJECTED)
