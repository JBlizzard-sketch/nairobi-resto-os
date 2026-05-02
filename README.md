# Nairobi Resto OS

**A full-stack restaurant operations and reservations platform built for independent upscale restaurants in Nairobi.**

Westlands. Kilimani. Karen. Hurlingham. These restaurants are running front-of-house on WhatsApp threads and paper notebooks. This platform fixes that — from the floor map to the kitchen, from the booking link to the Mpesa deposit.

---

## What This Is

A production-grade, multi-tenant SaaS platform covering every aspect of restaurant operations:

- **Visual floor map** — drag-and-drop table layout builder, live host view with real-time status
- **Reservations** — online guest booking, manual entry, conflict detection, turn-time logic
- **WhatsApp automation** — booking confirmations, 24hr and 2hr reminders via WhatsApp Business API
- **Mpesa deposits** — frictionless STK push deposit collection for peak slots via Daraja API
- **Pre-orders** — special occasion pre-order collection linked to the live menu, kitchen view
- **Guest CRM** — visit history, preferences, dietary notes, allergy flags per guest profile
- **Loyalty programme** — points, tiers, perks configured per restaurant
- **Revenue analytics** — covers, no-show rate, deposit conversion, booking window heatmaps
- **Waitlist** — fully-booked slot waitlist with WhatsApp slot-open notifications
- **Private dining** — enquiry-to-confirmation flow for private room and rooftop events
- **Staff management** — roles, PINs, shift scheduling, table assignments
- **Multi-outlet** — restaurant group dashboard with cross-outlet CRM and analytics
- **Guest digital experience** — QR menus, post-meal feedback, loyalty wallet

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TailwindCSS, shadcn/ui |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API Contract | OpenAPI 3.1 + Orval codegen |
| Real-time | WebSockets (ws) |
| Auth | JWT sessions, role-based access |
| WhatsApp | WhatsApp Business API (Cloud API) |
| Payments | Mpesa Daraja API (STK Push) |
| Monorepo | pnpm workspaces |
| TypeScript | 5.9 (strict) |

---

## Monorepo Structure

```
nairobi-resto-os/
├── artifacts/
│   ├── api-server/          # Express backend (REST API + WebSockets)
│   └── resto-app/           # React frontend (manager dashboard + guest booking)
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 source of truth
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + migrations
├── scripts/                 # Utility scripts
└── pnpm-workspace.yaml
```

---

## Phase Roadmap

| # | Phase | Status |
|---|---|---|
| 1 | Foundation, Multi-Tenancy & Auth | 🔨 In Progress |
| 2 | Floor Map Builder | 📋 Planned |
| 3 | Live Floor Map (Host View) | 📋 Planned |
| 4 | Reservations Core | 📋 Planned |
| 5 | Guest-Facing Booking Page | 📋 Planned |
| 6 | WhatsApp Automation | 📋 Planned |
| 7 | Mpesa Deposit Collection | 📋 Planned |
| 8 | Pre-Order Collection | 📋 Planned |
| 9 | Kitchen Pre-Order View | 📋 Planned |
| 10 | Manager Dashboard (Tonight View) | 📋 Planned |
| 11 | Guest CRM | 📋 Planned |
| 12 | Revenue & Operations Analytics | 📋 Planned |
| 13 | Waitlist | 📋 Planned |
| 14 | Loyalty Programme | 📋 Planned |
| 15 | Private Dining Booking Flow | 📋 Planned |
| 16 | Live Menu Management & Pre-Order Integration | 📋 Planned |
| 17 | Unified WhatsApp Inbox | 📋 Planned |
| 18 | Staff Management & Floor Assignment | 📋 Planned |
| 19 | Multi-Outlet (Restaurant Group Mode) | 📋 Planned |
| 20 | Guest Digital Experience (QR + Feedback + Wallet) | 📋 Planned |

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL 16+

### Environment Variables

Create a `.env` file at the workspace root (or set via Replit Secrets):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nairobi_resto

# Auth
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here

# WhatsApp Business API
WHATSAPP_TOKEN=your-whatsapp-cloud-api-token
WHATSAPP_PHONE_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token

# Mpesa Daraja
MPESA_CONSUMER_KEY=your-daraja-consumer-key
MPESA_CONSUMER_SECRET=your-daraja-consumer-secret
MPESA_SHORTCODE=your-business-shortcode
MPESA_PASSKEY=your-lipa-na-mpesa-passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

### Install & Run

```bash
# Install all dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Run API server (development)
pnpm --filter @workspace/api-server run dev

# Run frontend (development)
pnpm --filter @workspace/resto-app run dev

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Full typecheck
pnpm run typecheck
```

---

## Git Workflow

A push script is included at `scripts/push-to-github.sh` for periodic syncing:

```bash
bash scripts/push-to-github.sh "Your commit message"
```

---

## Target Market

Independent upscale restaurants in Nairobi's premium dining neighbourhoods — Westlands, Kilimani, Karen, Hurlingham. Pricing: **Ksh 15,000–30,000/month** per outlet. Restaurant groups on custom pricing.

---

## License

Proprietary. All rights reserved.
