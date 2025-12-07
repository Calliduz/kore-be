# Kore E-Commerce Backend

Production-ready Node.js + Express + MongoDB backend with TypeScript, enterprise-grade security, and UX-optimized API responses.

## Features

### Security
- **JWT Authentication** with httpOnly/secure cookies
- **Refresh Token Rotation** with reuse detection
- **Account Lockout** after 5 failed login attempts (30 min lock)
- **Helmet** security headers
- **Rate Limiting** (global + auth-specific)
- **MongoDB Sanitization** to prevent NoSQL injection

### UX-Support
- **Standardized ApiResponse** class for consistent frontend toast handling
- **Granular Zod validation errors** with field names for input highlighting
- **Cursor-based pagination** for efficient data loading
- **Field selection** to minimize payload size

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize MongoDB (optional - for seed data)
mongosh < scripts/init-db.js

# Start development server
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (requires auth) |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/search` | Search products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Health Check

```bash
GET /api/health
```

## API Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

### Validation Errors

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

## Pagination

Use cursor-based pagination for efficient data loading:

```bash
# First page
GET /api/products?limit=20

# Next page (use nextCursor from response)
GET /api/products?cursor=507f1f77bcf86cd799439011&limit=20

# With field selection
GET /api/products?fields=name,price,images&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "507f1f77bcf86cd799439012",
    "hasMore": true,
    "limit": 20
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before lockout | 5 |
| `LOCK_TIME_MS` | Account lock duration | 1800000 (30 min) |

## Project Structure

```
src/
├── config/         # Environment & database config
├── controllers/    # Route handlers
├── middleware/     # Express middleware
├── models/         # Mongoose schemas
├── routes/         # API routes
├── schemas/        # Zod validation schemas
├── services/       # Business logic
├── types/          # TypeScript interfaces
├── utils/          # Utilities (ApiResponse, pagination)
└── server.ts       # Entry point
```

## License

ISC
