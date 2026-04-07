# 🌍 Local Market — Village Marketplace

> Hyperlocal, influencer-driven marketplace with AI-powered multilingual inventory management.

**"Messy input → Clean system → Beautiful output"**

---

## 🏗️ Architecture

This is a **Turborepo monorepo** with three apps and two shared packages:

```
local-market/
├── apps/
│   ├── api/        # NestJS backend — REST API with Swagger docs
│   ├── web/        # Remix web app — public marketplace + role dashboards
│   └── mobile/     # Expo React Native — cross-platform iOS/Android/Web
├── packages/
│   ├── shared/     # TypeScript types, enums, interfaces (shared everywhere)
│   └── api-client/ # Axios-based API client (shared by web + mobile)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 9
- MongoDB running locally (or Atlas URI)

### Setup

```bash
# Install all dependencies
pnpm install

# Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# Edit apps/api/.env — set MONGODB_URI, JWT secrets, OPENAI_API_KEY

# Run all apps in dev mode
pnpm dev
```

This starts:
- API: http://localhost:3001/api/v1
- Swagger docs: http://localhost:3001/api/docs
- Web: http://localhost:3000
- Mobile: Expo DevTools

---

## 📱 Apps

### `apps/api` — NestJS Backend

**Modules:**

| Module | Description |
|---|---|
| `auth` | Register, login, JWT + refresh tokens |
| `users` | User management with RBAC |
| `businesses` | Business onboarding + influencer approval flow |
| `items` | Inventory management + AI import pipeline |
| `canonical` | 3-layer naming system (canonical → variations → items) |
| `categories` | Product category tree |
| `ai` | OpenAI wrappers: text normalization, Vision, Whisper |
| `search` | Cross-language, variation-aware search |
| `audit` | Admin audit log for all governance actions |

**Roles:**
- `ADMIN` — Full access, manages canonical items, categories, audit
- `INFLUENCER` — Approves/rejects businesses, curates local ecosystem
- `BUSINESS` — Lists products, uses AI import
- `PUBLIC` — Search & browse marketplace

---

### `apps/web` — Remix Web App

**Routes:**

| Route | Description |
|---|---|
| `/` | Public marketplace + multilingual search |
| `/login` | Authentication |
| `/register` | Registration with role selection |
| `/dashboard/business/inventory` | Business inventory management |
| `/dashboard/business/import` | AI-powered product import |
| `/dashboard/business/profile` | Business registration & profile |
| `/dashboard/influencer/approvals` | Approve/reject pending businesses |
| `/dashboard/influencer/businesses` | Curated businesses list |
| `/dashboard/admin/businesses` | All businesses management |
| `/dashboard/admin/canonical` | Canonical naming system |
| `/dashboard/admin/variations` | Pending variation review queue |
| `/dashboard/admin/categories` | Category tree management |
| `/dashboard/admin/audit` | Complete audit log |

---

### `apps/mobile` — Expo React Native

Same features as the web app, built with Expo Router for iOS, Android, and Web.

Uses `expo-secure-store` for secure token storage instead of `localStorage`.

---

## 🧠 Core Innovation: Canonical Naming System

The **3-layer data architecture** is the competitive moat:

```
Layer 1: Canonical (Truth)     — "Potato" (admin-controlled)
    ↑
Layer 2: Variations (Reality)  — "allu", "aloo", "آلو", "potat" (user inputs)
    ↑
Layer 3: Items (Transactions)  — Price, stock, business, source
```

**Flow:**
1. Business enters: `"Allu 50rs/kg"`
2. AI normalizes → `"Potato"` (confidence: 0.95)
3. System checks canonical DB for `"potato"` slug
4. If found: auto-links (high confidence) or queues for admin review
5. User confirms → saved cleanly
6. Public sees: `"Potato"` regardless of what was entered

---

## 🤖 AI Layer

Built around OpenAI APIs, wrapped in `apps/api/src/ai/`:

| Input | Model | Output |
|---|---|---|
| Text (any language) | `gpt-4o-mini` | Normalized product list |
| Image (shop photo) | `gpt-4o` Vision | Extracted inventory |
| Voice note | `whisper-1` → `gpt-4o-mini` | Transcribed + parsed inventory |

**Fallback:** When no API key is set, a built-in Roman Urdu / common transliteration map is used.

---

## 🔐 System Rules

1. ❌ No item enters the system without user verification
2. ❌ No direct user-controlled taxonomy
3. ✅ Always store raw input alongside canonical
4. ✅ Always map to canonical (or queue for review)
5. ✅ Admin has final authority on all data governance

---

## 📊 Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | Remix (React, App Router), Tailwind CSS |
| Mobile | Expo (React Native), NativeWind |
| Code sharing | Turborepo monorepo, `@local-market/shared`, `@local-market/api-client` |
| Backend | NestJS, Passport JWT |
| Database | MongoDB (Mongoose) |
| AI | OpenAI (GPT-4o, GPT-4o-mini, Whisper) |
| Auth | JWT + Refresh Tokens, bcrypt |
| API Docs | Swagger (auto-generated) |