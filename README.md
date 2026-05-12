# BloomNest Backend

Node.js + Express + MongoDB backend for the BloomNest flowers, gifts & events storefront.

## Stack
- Express 4
- MongoDB Atlas via Mongoose
- JWT access + rotating refresh tokens (httpOnly cookie)
- Cloudinary uploads via `multer-storage-cloudinary`
- bcrypt password hashing
- CORS, morgan, rate-limiting on login

## Setup

```bash
cd backend
npm install
cp .env.example .env   # values are already filled in .env
npm run seed           # creates admin + stores + banners + products
npm run dev            # starts on http://localhost:5001
```

The seed script creates the admin user using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults: `admin@flowers.com` / `admin`).

## API

Base URL: `http://localhost:5001/api`

### Auth
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/login` | `{ email, password }` → `{ accessToken, refreshToken, admin }`. Also sets `refreshToken` httpOnly cookie. |
| POST | `/auth/refresh` | Uses cookie or `{ refreshToken }` body. Rotates and returns new tokens. |
| POST | `/auth/logout` | Revokes refresh token. |
| GET  | `/auth/me` | Requires `Authorization: Bearer <accessToken>`. |

### Products
| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/products?category=flowers&type=natural&tag=bestseller` | public |
| GET | `/products/:id` | public |
| POST | `/products` | admin |
| PUT | `/products/:id` | admin |
| DELETE | `/products/:id` | admin |

### Stores
GET (public), POST/PUT/DELETE (admin) on `/stores` and `/stores/:id`.

### Orders
| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/orders` | admin (lists all) |
| GET | `/orders/:id` | public (lookup by order ID) |
| POST | `/orders` | public (decrements stock) |
| PATCH | `/orders/:id/status` | admin — `{ status, trackingUrl }` |
| DELETE | `/orders/:id` | admin |

### Events
GET (public), POST (public — enquiries), PUT/DELETE (admin).

### Banners
GET (public — `?active=true` for live banners only), POST/PUT/DELETE (admin).

### Uploads (Cloudinary)
| Method | Path | Body |
| ------ | ---- | ---- |
| POST | `/upload` | multipart `image` field — single file |
| POST | `/upload/multiple` | multipart `images` field — up to 10 files |
| DELETE | `/upload` | `{ publicId }` — destroys a Cloudinary asset |

All upload endpoints require admin auth and upload to the `bloomnext` Cloudinary folder.

## Notes
- Product/Store/Event IDs are stable string slugs (matching the frontend), not Mongo ObjectIds.
- Order IDs use the `ORD-XXXXXX` format the React frontend already shows.
- Placing an order decrements `storeInventory.stock` on the matching product/store.
- Refresh tokens are stored in MongoDB and auto-expire via a TTL index.
