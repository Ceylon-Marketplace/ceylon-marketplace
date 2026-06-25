# Ceylon Marketplace

A subscription-driven marketplace with real-time auctions, built for buying and selling items online.

**Stack:** Next.js 15 · Prisma · PostgreSQL · Redis · Vercel Blob

---

## Features

| Feature | Status |
| --- | --- |
| User Authentication | ✅ Done |
| Listings Management | ✅ Done |
| Real-time Auctions | ✅ Done |
| Messaging | ✅ Done |
| Subscriptions | ✅ Done |
| Admin Panel | ✅ Done |
| Reviews & Ratings | ✅ Done |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm or pnpm
- Docker (for PostgreSQL + Redis)

### Installation

```bash
git clone <repo>
cd ceylon-marketplace
cp .env.example .env
npm install
```

### Start Infrastructure

```bash
docker-compose up -d
```

### Database Setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
```

### Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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
│   ├── components/       Reusable UI components
│   ├── lib/              Utilities & helpers
│   └── store/            Zustand state management
├── prisma/               Database schema & migrations
├── public/               Static assets
└── docker-compose.yml    Infrastructure definition
```

---

## API Reference

| Module | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `GET /me` |
| Listings | `GET/POST /api/listings`, `GET /api/listings/:id` |
| Auctions | `GET/POST /api/auctions`, WebSocket support |
| Messaging | `GET/POST /api/conversations`, WebSocket support |
| Subscriptions | `GET /api/subscriptions/plans`, `POST .../subscribe` |
| Admin | `GET /api/admin/stats`, pending listings, user management |
| Reports | `POST /api/reports`, `GET /api/reports` (admin) |
| Notifications | `GET /api/notifications`, mark read |

---

## Business Rules

- **Listings** — title: 10–120 chars · max 10 images · max 3 videos · duplicate check
- **Subscriptions** — expired subscription blocks new listing creation
- **Auctions** — seller cannot self-bid · only higher bids accepted · reserve price hidden
- **Anti-sniping** — bid in last 2 min extends auction by 2 min
- **Messaging** — message history is immutable · blocking a user prevents messaging
- **Admin workflow** — listings go through `PENDING_REVIEW → ACTIVE / REJECTED`

## change by manoj