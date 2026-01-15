# Hotel Management System - API Documentation

## Overview

The Hotel Management System API provides a comprehensive RESTful interface for managing hotel operations including rooms, bookings, guests, rates, deals, and user management. The API uses JWT-based authentication with refresh tokens for secure access.

**Technology Stack:**

- Node.js with Express.js
- MySQL database with Prisma ORM
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation

### Interactive API Documentation

**Swagger UI** is available for interactive API exploration:

- **URL**: `http://localhost:3000/api-docs` (development)
- **Features**:
  - Try-it-out functionality
  - Request/response examples
  - Schema definitions
  - Authentication testing

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with a refresh token mechanism.

### Access Token

- **Storage**: Stored in `localStorage` on the client side
- **Header**: `Authorization: Bearer <accessToken>`
- **Expiration**: Configurable via `JWT_EXPIRES_IN` environment variable (default: 7 days)
- **Usage**: Required for all protected endpoints

### Refresh Token

- **Storage**: Stored as HTTP-only cookie (secure, not accessible via JavaScript)
- **Expiration**: 7 days
- **Usage**: Automatically sent with requests via cookies to refresh access tokens

### Authentication Flow

1. **Login**: User provides credentials → receives access token + refresh token (cookie)
2. **API Requests**: Include access token in `Authorization` header
3. **Token Refresh**: When access token expires, automatically refresh using refresh token cookie
4. **Logout**: Revokes refresh token and clears cookies

### Security Notes

⚠️ **Access Token Storage**: Access tokens are currently stored in `localStorage`. While this is common for SPAs, consider the following:

- **Risk**: Vulnerable to XSS attacks if malicious scripts can access localStorage
- **Mitigation**:
  - Refresh tokens are stored in HTTP-only cookies (protected from XSS)
  - Access tokens have shorter expiration times
  - Automatic token refresh reduces exposure window
- **Future Enhancement**: Consider storing access tokens in memory or using httpOnly cookies with CSRF protection

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Endpoints

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "string (min 3 chars)",
  "password": "string (min 6 chars)",
  "role": "USER | MANAGER | ADMIN (optional, defaults to USER)"
}
```

**Response:** `201 Created`

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "USER"
  }
}
```

**Note:** Refresh token is automatically set as HTTP-only cookie.

---

#### Refresh Access Token

```http
POST /api/auth/refresh
```

**Headers:** Refresh token sent automatically via cookie

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

**Note:** Revokes refresh token and clears cookies.

---

#### Google OAuth Login

```http
POST /api/auth/google
```

**Request Body:**

```json
{
  "credential": "Google ID token"
}
```

**Response:** `200 OK`

```json
{
  "message": "Google login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user_email",
    "role": "USER"
  }
}
```

---

### Users Endpoints

All user endpoints require authentication.

#### Get All Users

```http
GET /api/users
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "username": "john_doe",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Get User by ID

```http
GET /api/users/:id
```

**Authorization:** Users can view their own profile; ADMIN/MANAGER can view any profile

**Response:** `200 OK`

```json
{
  "id": 1,
  "username": "john_doe",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Update User

```http
PUT /api/users/:id
```

**Authorization:** Users can update their own profile; ADMIN/MANAGER can update any profile (role changes require ADMIN/MANAGER)

**Request Body:**

```json
{
  "username": "string (optional, min 3 chars)",
  "role": "USER | MANAGER | ADMIN (optional, requires ADMIN/MANAGER)"
}
```

**Response:** `200 OK`

```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "username": "john_doe_updated",
    "role": "USER",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Delete User

```http
DELETE /api/users/:id
```

**Authorization:** ADMIN only

**Response:** `200 OK`

```json
{
  "message": "User deleted successfully"
}
```

---

### Rooms Endpoints

#### Get All Rooms

```http
GET /api/rooms
```

**Query Parameters:**

- `type` (optional): Filter by room type (SINGLE, DOUBLE, DELUXE, SUITE)
- `startDate` (optional): Filter available rooms by start date (ISO format)
- `endDate` (optional): Filter available rooms by end date (ISO format)
- `guests` (optional): Filter by minimum capacity

**Example:**

```
GET /api/rooms?type=DOUBLE&startDate=2024-01-15&endDate=2024-01-20&guests=2
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "roomNumber": "201",
    "floor": "2",
    "type": "DOUBLE",
    "price": "150.00",
    "capacity": 2,
    "description": "Comfortable double room",
    "imageUrl": "/uploads/rooms/room-123.jpg",
    "cleanStatus": "CLEAN",
    "bookingStatus": "AVAILABLE",
    "bookedCount": 5,
    "features": [
      {
        "feature": {
          "id": 1,
          "name": "WiFi"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Get Room by ID

```http
GET /api/rooms/:id
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "roomNumber": "201",
  "floor": "2",
  "type": "DOUBLE",
  "price": "150.00",
  "capacity": 2,
  "description": "Comfortable double room",
  "imageUrl": "/uploads/rooms/room-123.jpg",
  "cleanStatus": "CLEAN",
  "bookingStatus": "AVAILABLE",
  "bookedCount": 5,
  "features": [...],
  "bookings": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Create Room

```http
POST /api/rooms
```

**Authorization:** ADMIN, MANAGER

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

- `type`: SINGLE | DOUBLE | DELUXE | SUITE (required)
- `price`: number (required)
- `capacity`: integer (required, min: 1)
- `description`: string (required)
- `floor`: string (optional)
- `cleanStatus`: CLEAN | DIRTY | IN_PROGRESS (optional, defaults to CLEAN)
- `image`: file (optional, max 5MB)

**Response:** `201 Created`

```json
{
  "id": 1,
  "roomNumber": "201",
  "type": "DOUBLE",
  "price": "150.00",
  "capacity": 2,
  "description": "Comfortable double room",
  "imageUrl": "/uploads/rooms/room-123.jpg",
  "cleanStatus": "CLEAN",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Update Room

```http
PUT /api/rooms/:id
```

**Authorization:** ADMIN, MANAGER

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

- `price`: number (optional)
- `capacity`: integer (optional)
- `description`: string (optional)
- `type`: SINGLE | DOUBLE | DELUXE | SUITE (optional)
- `cleanStatus`: CLEAN | DIRTY | IN_PROGRESS (optional)
- `floor`: string (optional)
- `image`: file (optional, max 5MB)

**Response:** `200 OK`

```json
{
  "message": "Room updated successfully",
  "room": {
    "id": 1,
    "roomNumber": "201",
    "type": "DOUBLE",
    "price": "175.00",
    "capacity": 2,
    "description": "Updated description",
    "imageUrl": "/uploads/rooms/room-456.jpg",
    "cleanStatus": "CLEAN",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Delete Room

```http
DELETE /api/rooms/:id
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
{
  "message": "Room deleted successfully"
}
```

**Note:** Cannot delete rooms with active bookings.

---

#### Update Room Clean Status

```http
PATCH /api/rooms/:id/clean-status
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "cleanStatus": "CLEAN | DIRTY | IN_PROGRESS"
}
```

**Response:** `200 OK`

```json
{
  "message": "Clean status updated successfully",
  "room": {
    "id": 1,
    "cleanStatus": "CLEAN",
    ...
  }
}
```

---

### Bookings Endpoints

#### Get All Bookings

```http
GET /api/bookings
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "userId": 1,
    "roomId": 1,
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-20T00:00:00.000Z",
    "status": "CONFIRMED",
    "customerFirstName": "John",
    "customerLastName": "Doe",
    "customerEmail": "john@example.com",
    "paymentType": "CARD",
    "paymentStatus": "PAID",
    "baseRate": "150.00",
    "finalPrice": "750.00",
    "dealId": null,
    "room": {
      "id": 1,
      "roomNumber": "201",
      "type": "DOUBLE",
      "capacity": 2,
      "price": "150.00"
    },
    "user": {
      "id": 1,
      "username": "john_doe",
      "role": "USER"
    },
    "guests": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Get Booking by ID

```http
GET /api/bookings/:id
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "roomId": 1,
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-20T00:00:00.000Z",
  "status": "CONFIRMED",
  "room": {...},
  "user": {...},
  "deal": {...},
  "guests": {...},
  ...
}
```

---

#### Create Booking

```http
POST /api/bookings
```

**Authorization:** Required (authenticated users)

**Request Body:**

```json
{
  "roomId": 1,
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "customerFirstName": "John",
  "customerLastName": "Doe",
  "customerEmail": "john@example.com",
  "paymentType": "CARD | CASH | PAYPAL",
  "dealId": 1
}
```

**Response:** `201 Created`

```json
{
  "message": "Booking created successfully for room 201",
  "booking": {
    "id": 1,
    "roomId": 1,
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-20T00:00:00.000Z",
    "status": "CONFIRMED",
    "finalPrice": "750.00",
    "room": {...},
    "deal": {...}
  }
}
```

**Note:**

- Automatically finds available room of the same type if requested room is booked
- Automatically creates linked guest record
- Bookings are auto-confirmed to immediately reflect availability

---

#### Update Booking

```http
PATCH /api/bookings/:id
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "roomId": 1,
  "startDate": "2024-01-16",
  "endDate": "2024-01-21",
  "customerFirstName": "John",
  "customerLastName": "Doe",
  "customerEmail": "john@example.com",
  "paymentType": "CARD",
  "status": "CONFIRMED",
  "dealId": 1
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "roomId": 1,
  "startDate": "2024-01-16T00:00:00.000Z",
  "endDate": "2024-01-21T00:00:00.000Z",
  "status": "CONFIRMED",
  "finalPrice": "750.00",
  ...
}
```

**Note:** Automatically recalculates price if dates, room, or deal changes.

---

#### Delete Booking

```http
DELETE /api/bookings/:id
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
{
  "message": "Booking deleted successfully"
}
```

**Note:** Also deletes associated guest records.

---

### Rates Endpoints

All rate endpoints require authentication.

#### Get All Rates

```http
GET /api/rates
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "roomId": 1,
    "policy": "FLEXIBLE",
    "rate": "150.00",
    "dealPrice": "135.00",
    "dealId": 1,
    "availableRooms": 5,
    "room": {...},
    "deal": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Get Rate by ID

```http
GET /api/rates/:id
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "roomId": 1,
  "policy": "FLEXIBLE",
  "rate": "150.00",
  "dealPrice": "135.00",
  "availableRooms": 5,
  "room": {...},
  "deal": {...}
}
```

---

#### Create Rate

```http
POST /api/rates
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "roomId": 1,
  "policy": "STRICT | FLEXIBLE | NON_REFUNDABLE",
  "rate": 150.0,
  "dealId": 1
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "roomId": 1,
  "policy": "FLEXIBLE",
  "rate": "150.00",
  "dealPrice": "135.00",
  "availableRooms": 5,
  "room": {...},
  "deal": {...}
}
```

---

#### Update Rate

```http
PUT /api/rates/:id
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "roomId": 1,
  "policy": "FLEXIBLE",
  "rate": 175.0,
  "dealId": 1
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "roomId": 1,
  "policy": "FLEXIBLE",
  "rate": "175.00",
  "dealPrice": "157.50",
  "availableRooms": 5,
  ...
}
```

---

#### Delete Rate

```http
DELETE /api/rates/:id
```

**Authorization:** ADMIN only

**Response:** `200 OK`

```json
{
  "message": "Rate deleted"
}
```

---

### Deals Endpoints

#### Get All Deals

```http
GET /api/deals
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Summer Sale",
    "discount": 10,
    "status": "ONGOING",
    "endDate": "2024-08-31T00:00:00.000Z",
    "roomType": "ALL",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Get Deal by ID

```http
GET /api/deals/:id
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Summer Sale",
  "discount": 10,
  "status": "ONGOING",
  "endDate": "2024-08-31T00:00:00.000Z",
  "roomType": "ALL"
}
```

---

#### Create Deal

```http
POST /api/deals
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "name": "Summer Sale",
  "discount": 10,
  "roomType": "ALL | SINGLE | DOUBLE | SUITE | DELUXE",
  "status": "ONGOING | INACTIVE | FULL",
  "endDate": "2024-08-31"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Summer Sale",
  "discount": 10,
  "status": "ONGOING",
  "endDate": "2024-08-31T00:00:00.000Z",
  "roomType": "ALL",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Update Deal

```http
PUT /api/deals/:id
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "name": "Summer Sale Updated",
  "discount": 15,
  "status": "ONGOING",
  "endDate": "2024-09-30",
  "roomType": "DOUBLE"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Summer Sale Updated",
  "discount": 15,
  "status": "ONGOING",
  "endDate": "2024-09-30T00:00:00.000Z",
  "roomType": "DOUBLE",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Delete Deal

```http
DELETE /api/deals/:id
```

**Authorization:** ADMIN only

**Response:** `200 OK`

```json
{
  "message": "Deal deleted"
}
```

---

### Guests Endpoints

All guest endpoints require authentication.

#### Get All Guests

```http
GET /api/guests
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "bookingId": 1,
    "roomId": 1,
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "finalPrice": "750.00",
    "dealId": 1,
    "currentStatus": "CONFIRMED",
    "room": {
      "roomNumber": "201",
      "type": "DOUBLE"
    },
    "booking": {...},
    "deal": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Update Guest Status

```http
PATCH /api/guests/:id/status
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "status": "CONFIRMED | COMPLETED",
  "paymentStatus": "PENDING | PAID | FAILED",
  "earlyCheckoutDate": "2024-01-18"
}
```

**Response:** `200 OK`

```json
{
  "message": "Guest + booking updated",
  "guest": {...},
  "booking": {...},
  "refund": {
    "refundAmount": 150.00,
    "refundable": true,
    "reason": "Flexible policy - full refund for 2 unused night(s)",
    "policy": "FLEXIBLE",
    "unusedNights": 2,
    "originalPrice": 750.00,
    "pricePerNight": 150.00
  }
}
```

**Note:**

- Supports early check-out with automatic refund calculation based on rate policy
- Refund policies:
  - **NON_REFUNDABLE**: No refund
  - **FLEXIBLE**: Full refund for unused nights
  - **STRICT**: 50% refund for unused nights

---

### Contact Endpoints

#### Send Contact Message

```http
POST /api/contact
```

**Public endpoint** (no authentication required)

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I would like to inquire about availability..."
}
```

**Response:** `201 Created`

```json
{
  "message": "Message received successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to inquire about availability...",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Get All Messages

```http
GET /api/contact
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I would like to inquire about availability...",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### Mark Message as Read/Unread

```http
PATCH /api/contact/:id/read
```

**Authorization:** ADMIN, MANAGER

**Request Body:**

```json
{
  "read": true
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "message": "...",
  "read": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### Delete Message

```http
DELETE /api/contact/:id
```

**Authorization:** ADMIN, MANAGER

**Response:** `200 OK`

```json
{
  "message": "Message deleted successfully"
}
```

---

## Data Models

### User

```typescript
{
  id: number;
  username: string;
  password: string; // hashed, never returned in API
  role: "USER" | "MANAGER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
```

### Room

```typescript
{
  id: number;
  roomNumber: string;
  floor?: string;
  type: "SINGLE" | "DOUBLE" | "DELUXE" | "SUITE";
  price: Decimal;
  capacity: number;
  description?: string;
  imageUrl?: string;
  cleanStatus: "CLEAN" | "DIRTY" | "IN_PROGRESS";
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking

```typescript
{
  id: number;
  userId: number;
  roomId: number;
  startDate: Date;
  endDate: Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  paymentType?: "CARD" | "CASH" | "PAYPAL";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  baseRate?: Decimal;
  finalPrice?: Decimal;
  dealId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Guest

```typescript
{
  id: number;
  fullName: string;
  email?: string;
  bookingId: number;
  roomId?: number;
  status: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  finalPrice?: Decimal;
  dealId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rate

```typescript
{
  id: number;
  roomId: number;
  policy: "STRICT" | "FLEXIBLE" | "NON_REFUNDABLE";
  rate: Decimal;
  dealPrice?: Decimal;
  dealId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Deal

```typescript
{
  id: number;
  name: string;
  discount: number; // percentage
  status: "ONGOING" | "FULL" | "INACTIVE";
  endDate?: Date;
  roomType: "SINGLE" | "DOUBLE" | "SUITE" | "DELUXE" | "ALL";
  createdAt: Date;
  updatedAt: Date;
}
```

### Contact

```typescript
{
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

---

## Security

### Authentication & Authorization

- **JWT Tokens**: Access tokens signed with secret key
- **Refresh Tokens**: Stored in HTTP-only cookies, automatically rotated
- **Password Hashing**: bcryptjs with salt rounds (12)
- **Role-Based Access Control**: ADMIN, MANAGER, USER roles
- **Session Logging**: All login, refresh, and logout actions logged

### Security Headers

- **Helmet.js**: Security headers (XSS protection, content security policy, etc.)
- **CORS**: Configured for specific origins
- **Rate Limiting**: 100 requests per 15 minutes (production), 1000 (development)

### Token Management

- **Access Token**: Short-lived, stored in localStorage
- **Refresh Token**: Long-lived (7 days), HTTP-only cookie
- **Automatic Cleanup**: Expired tokens cleaned daily via cron job
- **Token Revocation**: Logout revokes refresh tokens

### Best Practices

1. Always use HTTPS in production
2. Never expose JWT_SECRET in client code
3. Validate all input using express-validator
4. Use parameterized queries (Prisma handles this)
5. Implement proper error handling without exposing sensitive info

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Development**: 1000 requests per 15 minutes per IP
- **Production**: 100 requests per 15 minutes per IP

When rate limit is exceeded:

```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Health Check

```http
GET /api/health
```

**Response:** `200 OK`

```json
{
  "status": "OK",
  "message": "Hotel Management API running securely"
}
```

---

## Additional Notes

### Timezone Handling

- All dates are stored in UTC
- Frontend displays dates in Europe/Belgrade timezone
- Booking dates are normalized to start of day for accurate comparisons

### File Uploads

- Room images: Max 5MB
- Stored in `/uploads/rooms/`
- Served statically at `/uploads/rooms/:filename`

### Database

- MySQL with Prisma ORM
- Automatic migrations
- Foreign key constraints and indexes for data integrity

---

## Additional Resources

- **Swagger UI**: Interactive API documentation at `/api-docs`
- **Requirements Review**: See `REQUIREMENTS_REVIEW.md` for implementation status
- **Server README**: See `server/README.md` for setup instructions
