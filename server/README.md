# Hotel Management System

A complete hotel management system with RESTful API for managing users, rooms, and bookings.

## Project Structure

```
projs/
├── server/                 # Backend API server
│   ├── src/               # Source code
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── server.js      # Main server file
│   ├── prisma/            # Database schema and migrations
│   ├── package.json       # Server dependencies
│   └── config.env         # Environment configuration
├── package.json           # Root project management
└── README.md             # This file
```

## Features

- **User Management**: Register, login, and manage user accounts with role-based access
- **Room Management**: CRUD operations for hotel rooms with different types and pricing
- **Booking System**: Create, manage, and track room bookings with availability checks
- **Authentication**: JWT-based authentication with role-based authorization
- **Database**: MySQL with Prisma ORM for type-safe database operations

## Tech Stack

- **Node.js** with Express.js
- **MySQL** database
- **Prisma** ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

## Quick Setup

1. **Install server dependencies:**

   ```bash
   npm run install-server
   ```

2. **Set up environment variables:**

   ```bash
   cp server/config.env server/.env
   ```

3. **Complete setup (database + seed data):**

   ```bash
   npm run setup
   ```

4. **Start the server:**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users` - Get all users (Admin/Manager only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Rooms

- `GET /api/rooms` - Get all rooms (with filters)
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (Admin/Manager only)
- `PUT /api/rooms/:id` - Update room (Admin/Manager only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### Bookings

- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update booking status (Admin/Manager only)
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `DELETE /api/bookings/:id` - Delete booking (Admin only)

## User Roles

- **USER**: Can view and manage their own bookings
- **MANAGER**: Can manage rooms and bookings, view all users
- **ADMIN**: Full access to all operations

## Database Schema

### User

- id, username, password, role, createdAt, updatedAt

### Room

- id, roomNumber, type, price, status, createdAt, updatedAt

### Booking

- id, userId, roomId, startDate, endDate, status, createdAt, updatedAt

## Environment Variables

```env
DATABASE_URL="mysql://username:password@localhost:3306/hotel_management"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

## Health Check

- `GET /api/health` - Check API status

## clean tokens

node scripts/cleanupTokens.js
