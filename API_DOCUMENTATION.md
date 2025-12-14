# KORE Backend - Complete API Documentation

> **Base URL**: `http://localhost:5000/api`
> **Authentication**: JWT tokens stored in HTTP-only cookies

---

## Quick Reference

| Module                    | Base Path                   | Auth Required          |
| ------------------------- | --------------------------- | ---------------------- |
| [Auth](#authentication)   | `/api/auth`                 | No (except logout, me) |
| [Users](#users)           | `/api/users`                | Yes                    |
| [Products](#products)     | `/api/products`             | No (except CRUD)       |
| [Reviews](#reviews)       | `/api/products/:id/reviews` | Mixed                  |
| [Orders](#orders)         | `/api/orders`               | Yes                    |
| [Coupons](#coupons)       | `/api/coupons`              | Mixed                  |
| [Wishlist](#wishlist)     | `/api/wishlist`             | Yes                    |
| [Newsletter](#newsletter) | `/api/newsletter`           | No (except admin)      |
| [Payments](#payments)     | `/api/payment`              | Yes                    |
| [Checkout](#checkout)     | `/api/checkout`             | Yes                    |
| [Config](#config)         | `/api/config`               | No                     |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Authentication

### `POST /api/auth/register`

Register a new user account.

**Access**: Public

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**: User object + sets cookies

---

### `POST /api/auth/login`

Login with email and password.

**Access**: Public

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**: User object + sets accessToken and refreshToken cookies

---

### `POST /api/auth/logout`

Logout and clear authentication cookies.

**Access**: Private (requires authentication)

**Response**: Success message + clears cookies

---

### `GET /api/auth/me`

Get current authenticated user.

**Access**: Private

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

---

### `POST /api/auth/refresh`

Refresh access token using refresh token cookie.

**Access**: Requires refresh token cookie

**Response**: Sets new accessToken cookie

---

## Users

### `PUT /api/users/profile`

Update current user's profile.

**Access**: Private

**Request Body**:

```json
{
  "name": "New Name", // optional
  "password": "NewPass123!" // optional
}
```

---

### `GET /api/users`

Get all users.

**Access**: Admin only

**Response**: Array of user objects (without passwords)

---

### `GET /api/users/:id`

Get user by ID.

**Access**: Admin only

---

### `PUT /api/users/:id/role`

Update user role.

**Access**: Admin only

**Request Body**:

```json
{
  "role": "admin" // "user" or "admin"
}
```

---

### `DELETE /api/users/:id`

Delete a user.

**Access**: Admin only

**Note**: Cannot delete your own account (returns 403)

---

## Products

### `GET /api/products`

Get products with filtering, sorting, and pagination.

**Access**: Public

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name/description |
| `category` | string | Filter by category |
| `sort` | string | `price_asc`, `price_desc`, `newest`, `name_asc` |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `cursor` | string | Pagination cursor |
| `limit` | number | Items per page (default: 20) |

**Response**:

```json
{
  "success": true,
  "data": {
    "data": [...products],
    "pagination": {
      "hasMore": true,
      "nextCursor": "abc123"
    }
  }
}
```

---

### `GET /api/products/search`

Search products.

**Access**: Public

**Query Parameters**: Same as GET /api/products

---

### `GET /api/products/:id`

Get single product by ID.

**Access**: Public

---

### `POST /api/products`

Create a new product.

**Access**: Admin only

**Request Body**:

```json
{
  "name": "Product Name",
  "description": "Description",
  "price": 99.99,
  "category": "Electronics",
  "images": ["url1", "url2"],
  "stock": 100
}
```

---

### `PUT /api/products/:id`

Update a product.

**Access**: Admin only

**Request Body**: Partial product object

---

### `DELETE /api/products/:id`

Delete a product.

**Access**: Admin only

---

## Reviews

### `GET /api/products/:id/reviews`

Get all reviews for a product.

**Access**: Public

**Response**:

```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "averageRating": 4.5,
    "totalReviews": 10
  }
}
```

---

### `POST /api/products/:id/reviews`

Create a review for a product.

**Access**: Private

**Request Body**:

```json
{
  "rating": 5, // 1-5
  "comment": "Great!" // optional
}
```

**Note**: User must have purchased the product and not already reviewed it.

---

### `GET /api/products/:id/can-review`

Check if current user can review a product.

**Access**: Private

**Response**:

```json
{
  "success": true,
  "data": {
    "canReview": true,
    "hasPurchased": true,
    "hasReviewed": false
  }
}
```

---

## Orders

### `POST /api/orders`

Create a new order.

**Access**: Private

**Request Body**:

```json
{
  "orderItems": [
    {
      "product": "productId",
      "name": "Product Name",
      "qty": 2,
      "price": 99.99,
      "image": "url"
    }
  ],
  "shippingAddress": {
    "address": "123 Main St",
    "city": "NYC",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "stripe",
  "taxPrice": 10.0,
  "shippingPrice": 5.0,
  "totalPrice": 115.0,
  "couponCode": "SAVE10" // optional
}
```

---

### `GET /api/orders/myorders`

Get current user's orders.

**Access**: Private

---

### `GET /api/orders/:id`

Get order by ID.

**Access**: Private (owner or admin)

---

### `GET /api/orders`

Get all orders.

**Access**: Admin only

---

### `PUT /api/orders/:id/pay`

Mark order as paid.

**Access**: Private

**Request Body**:

```json
{
  "id": "stripe_payment_id",
  "status": "completed",
  "update_time": "2024-01-01T00:00:00Z",
  "email_address": "user@example.com"
}
```

---

### `PUT /api/orders/:id/deliver`

Mark order as delivered.

**Access**: Admin only

---

### `PUT /api/orders/:id/status`

Update order status.

**Access**: Admin only

**Request Body**:

```json
{
  "status": "shipped" // "processing", "shipped", or "delivered"
}
```

---

## Coupons

### `POST /api/coupons/validate`

Validate a coupon code.

**Access**: Public

**Request Body**:

```json
{
  "code": "SAVE20",
  "cartTotal": 100.0
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "_id": "...",
      "code": "SAVE20",
      "discountType": "percentage",
      "discountValue": 20,
      "minPurchase": 50
    },
    "discountAmount": 20.0,
    "message": "Coupon applied successfully"
  }
}
```

---

### `GET /api/coupons`

Get all coupons.

**Access**: Admin only

---

### `POST /api/coupons`

Create a new coupon.

**Access**: Admin only

**Request Body**:

```json
{
  "code": "NEWYEAR",
  "discountType": "percentage", // "percentage" or "fixed"
  "discountValue": 25,
  "minPurchase": 50, // optional, default 0
  "maxUses": 100, // optional, 0 = unlimited
  "isActive": true, // optional, default true
  "expiresAt": "2024-12-31T23:59:59Z" // optional, null = never
}
```

---

### `PUT /api/coupons/:id`

Update a coupon.

**Access**: Admin only

**Request Body**: Partial coupon object

---

### `DELETE /api/coupons/:id`

Delete a coupon.

**Access**: Admin only

---

## Wishlist

### `GET /api/wishlist`

Get current user's wishlist.

**Access**: Private

**Response**:

```json
{
  "success": true,
  "data": {
    "wishlist": [...products]  // Populated product objects
  }
}
```

---

### `POST /api/wishlist/:productId`

Add product to wishlist.

**Access**: Private

---

### `DELETE /api/wishlist/:productId`

Remove product from wishlist.

**Access**: Private

---

## Newsletter

### `POST /api/newsletter/subscribe`

Subscribe to newsletter.

**Access**: Public

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Note**: Returns 409 Conflict if email already subscribed.

---

### `GET /api/newsletter/subscribers`

Get all newsletter subscribers.

**Access**: Admin only

---

## Payments

### `POST /api/payment/create-payment-intent`

Create a Stripe PaymentIntent.

**Access**: Private

**Request Body**:

```json
{
  "orderId": "order_id"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..."
  }
}
```

---

### `POST /api/payment/webhook`

Handle Stripe webhook events.

**Access**: Public (verified by Stripe signature)

**Note**: Requires raw body for signature verification.

---

## Checkout

### `POST /api/checkout/create-payment-intent`

Alternative endpoint for payment intent creation.

**Access**: Private

---

### `POST /api/checkout/webhook`

Alternative Stripe webhook endpoint.

**Access**: Public

---

## Config

### `GET /api/config/stripe`

Get Stripe publishable key.

**Access**: Public

**Response**:

```json
{
  "success": true,
  "data": {
    "publishableKey": "pk_test_..."
  }
}
```

---

## Health Check

### `GET /api/health`

Server health check.

**Access**: Public

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 12345.67
  }
}
```

---

## Test Accounts

After running `npm run seed`:

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| Admin | `admin@kore.com` | `Admin123!` |
| User  | `user@test.com`  | `User123!`  |

---

## HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
