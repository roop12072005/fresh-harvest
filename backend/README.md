# FreshCart API

Node.js + Express + MongoDB backend for the FreshHarvest / FreshCart storefront.

## Setup

```bash
cd backend
copy .env.example .env
npm install
```

Ensure MongoDB is running locally and the `freshcart` database is available.

```bash
npm run seed
npm run dev
```

API base URL: `http://localhost:5000`

## Phase 1 endpoints

- `GET /api/health`
- `GET /api/categories`
- `GET /api/categories/:categoryId`
- `GET /api/products`
- `GET /api/products/:productId`
- `GET /api/products/:productId/related`

Product query params: `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `organic`, `inStock`, `deals`, `featured`, `sort`, `page`, `limit`.
