# Atlas Commerce

A production-ready full-stack e-commerce platform with Vue 3, Vite, TypeScript, Pinia, NestJS, Prisma, PostgreSQL, JWT auth, admin dashboard, business intelligence analytics, ads strategy planning, competitor intelligence, local cart persistence, and WhatsApp cash-on-delivery checkout.

## Structure

```text
/frontend  Vue 3 storefront and admin UI
/backend   NestJS REST API, Prisma schema, Vercel serverless entrypoint
```

## Backend Local Setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Backend environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_URL="http://localhost:5173"
```

The API runs at `http://localhost:3000/api`.

## Frontend Local Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend environment variables:

```env
VITE_API_URL="http://localhost:3000/api"
VITE_STORE_WHATSAPP_NUMBER="212600000000"
```

The frontend runs at `http://localhost:5173`.

## Admin Credentials

```text
Email: admin@example.com
Password: Admin123456
```

## Business Intelligence and Ads Strategy

The admin area includes a BI dashboard for decision-making, not just store management. It calculates revenue, order status distribution, city performance, monthly revenue, best sellers, low-stock products, products without sales, and product promotion recommendations from the existing Prisma commerce data.

Admin pages:

- `/admin` dashboard with revenue, order, customer, city, and top-product analytics
- `/admin/product-research` product research segments and recommendations
- `/admin/ads` simulated ads manager for draft campaigns and generated strategy ideas

The ads strategy module is intentionally a simulation layer. It does not call Facebook, Meta, Google, or any external ads API. It uses product, category, city, budget, and objective inputs to produce audience, copy, strategy, and creative recommendations.

## Veille concurrentielle et analyse publicitaire

La page `/admin/competitor-intelligence` permet à l’administrateur de :

- gérer les profils de concurrents et leurs liens publics ;
- enregistrer manuellement des publicités visibles publiquement dans un swipe file ;
- analyser les hooks, offres, CTA, angles, preuves de confiance, forces et faiblesses ;
- générer des liens de recherche publique pour Google, Meta Ad Library, Google Ads Transparency et TikTok Creative Center ;
- produire une synthèse concurrentielle par produit, un score d’opportunité et un positionnement recommandé ;
- générer cinq variations de copies publicitaires professionnelles en français ;
- importer une recommandation concurrentielle dans le module Ads Strategy.

Utilisation recommandée :

1. Ajouter un concurrent.
2. Enregistrer manuellement une publicité publique et sa source.
3. Lier la publicité à un produit puis lancer l’analyse.
4. Ouvrir l’onglet Analyse produit et générer l’insight concurrentiel.
5. Importer le positionnement dans Ads Strategy ou utiliser le générateur de copies.

### Cadre éthique et légal

Ce module est un outil de recherche marketing et d’aide à la décision. Il ne scrape aucun site, ne contourne aucune protection, ne pirate aucun compte et n’accède à aucune donnée privée. Il n’intègre pas directement Facebook Ads ou Meta Ads. Les informations concurrentes doivent être publiques, légales et collectées manuellement. Une intégration officielle à Meta Ads API pourrait être étudiée ultérieurement, sous réserve des autorisations et règles de la plateforme.

## Production Deployment

### PostgreSQL

Create a PostgreSQL database on Neon, Supabase, or Railway. Copy the production connection string into `DATABASE_URL`.

### Backend on Vercel

1. Import `/backend` as a Vercel project.
2. Add `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` in Vercel environment variables.
3. Deploy.
4. Run migrations and seed data against production from your machine:

```bash
cd backend
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npx prisma db seed
```

The backend includes `backend/vercel.json` and `backend/api/index.ts` for NestJS serverless execution.

### Frontend on Vercel

1. Import `/frontend` as a Vercel project.
2. Add `VITE_API_URL` with the deployed backend URL ending in `/api`.
3. Add `VITE_STORE_WHATSAPP_NUMBER` without `+`, spaces, or dashes.
4. Deploy.

The frontend includes `frontend/vercel.json` so Vue Router works on refresh.

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/products` admin
- `PATCH /api/products/:id` admin
- `DELETE /api/products/:id` admin
- `GET /api/categories`
- `POST /api/categories` admin
- `PATCH /api/categories/:id` admin
- `DELETE /api/categories/:id` admin
- `POST /api/orders`
- `GET /api/orders/mine`
- `GET /api/orders` admin
- `PATCH /api/orders/:id/status` admin
- `GET /api/users` admin
- `GET /api/admin/stats` admin
- `GET /api/admin/analytics/overview` admin
- `GET /api/admin/analytics/top-products` admin
- `GET /api/admin/analytics/sales-by-city` admin
- `GET /api/admin/analytics/orders-by-status` admin
- `GET /api/admin/analytics/monthly-revenue` admin
- `GET /api/admin/analytics/product-research` admin
- `POST /api/admin/ads` admin
- `GET /api/admin/ads` admin
- `GET /api/admin/ads/:id` admin
- `PATCH /api/admin/ads/:id` admin
- `DELETE /api/admin/ads/:id` admin
- `POST /api/admin/ads/generate-strategy` admin
- `POST /api/admin/competitors` admin
- `GET /api/admin/competitors` admin
- `GET /api/admin/competitors/:id` admin
- `PATCH /api/admin/competitors/:id` admin
- `DELETE /api/admin/competitors/:id` admin
- `GET /api/admin/competitors/dashboard` admin
- `GET /api/admin/competitors/research-links/:productId` admin
- `POST /api/admin/competitors/generate-ad-copy` admin
- `POST /api/admin/competitor-ads` admin
- `GET /api/admin/competitor-ads` admin
- `POST /api/admin/competitor-ads/:id/analyze` admin
- `POST /api/admin/competitor-insights/generate` admin
- `GET /api/admin/competitor-insights` admin
- `GET /api/admin/competitor-insights/product/:productId` admin

## Checkout Flow

The checkout form creates the order and order items in PostgreSQL first. The backend returns a formatted WhatsApp message, the frontend encodes it, opens:

```text
https://wa.me/{VITE_STORE_WHATSAPP_NUMBER}?text={ENCODED_MESSAGE}
```

Then the cart is cleared after successful order creation.
