# StockSense

**Modular Inventory Management System (IMS)**

StockSense is a centralized, real-time IMS designed to replace manual registers and Excel sheets. Built for Inventory Managers and Warehouse Staff to track incoming stock, deliveries, and stock adjustments with an immutable stock ledger.

## Features (MVP Scope)

- **Auth:** NextAuth (Credentials provider) with password hashing.
- **Dashboard:** KPIs (Total Receipts, Deliveries, Stock Levels) and Recent Move History.
- **Product Catalog:** Create and manage products, categories, and view stock levels per location.
- **Receipts:** Record incoming stock and validate to automatically increase stock.
- **Deliveries:** Record outgoing stock and validate to automatically decrease stock (with negative stock prevention).
- **Stock Adjustments:** Manually reconcile counted vs recorded stock levels.
- **Move History / Stock Ledger:** The single source of truth for all stock movements. Every transaction writes an immutable audit trail.

## Scope Cuts for MVP
*To keep the project within the hackathon timeframe, the following scope cuts were made:*
- **Auth OTP/Email:** Mocked via console logging; real emails are not sent.
- **Reorder Rules:** Implemented as a simple `quantity < reorderPoint` check, not a push notification system.
- **Testing:** Manual testing only.
- **Hardware:** No barcode scanning integration.
- **UI Data Selection:** Some relationships use raw text-input IDs for rapid scaffolding instead of comprehensive dropdown selectors.
- **Internal Transfers:** Scoped out to focus on core incoming/outgoing and adjustment logic.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14 (App Router, TypeScript)** |
| Database | **PostgreSQL** (hosted on Neon) |
| ORM | **Prisma** |
| Auth | **NextAuth.js (Credentials provider)** |
| UI | **TailwindCSS + shadcn/ui** |
| Deployment | **Vercel** |

## Getting Started Locally

1. **Clone the repo and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file with your PostgreSQL connection string:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/db?schema=public"
   ```

3. **Run Prisma Migrations & Generate Client:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Live Demo

*The live Vercel deployment link will be available here shortly.*
