# Hotel Management System

A complete full-stack hotel management system with REST API backend and modern web frontend.

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
│   ├── .env              # Environment configuration
│   ├── README.md         # Server documentation
│   ├── DOCKER_SETUP.md   # Docker setup guide
│   └── project.txt       # Original requirements
├── client/                # Frontend React application
├── package.json           # Root project management
└── README.md             # This file
```

## Quick Start

1. **Install all dependencies:**

   ```bash
   npm run install-all
   ```

2. **Set up environment:**

   ```bash
   cp server/config.env server/.env
   ```

3. **Complete setup (database + seed data):**

   ```bash
   npm run setup
   ```

4. **Start both server and client:**

   ```bash
   npm run dev:both
   ```

   Or start them separately:

   ```bash
   # Terminal 1 - Server
   npm run dev

   # Terminal 2 - Client
   npm run dev:client
   ```

## Available Scripts

- `npm run install-all` - Install all dependencies (server + client)
- `npm run dev` - Start development server
- `npm run dev:client` - Start React client
- `npm run dev:both` - Start both server and client concurrently
- `npm run start` - Start production server
- `npm run setup` - Complete setup (install + database + seed)
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with dummy data

## Documentation

- **Server Documentation:** See `server/README.md`
- **Docker Setup:** See `server/DOCKER_SETUP.md`
- **Original Requirements:** See `server/project.txt`

## Tech Stack

- **Backend:** Node.js, Express.js, MySQL, Prisma ORM
- **Frontend:** React 19, React Router DOM, Tailwind CSS
- **Authentication:** JWT with role-based authorization
- **Database:** MySQL with Docker support
- **Charts:** Recharts for dashboard visualizations

## Features

### Client Features

- **Authentication System**: JWT-based login with role-based access
- **Role-based Routing**:
  - ADMIN users → Dashboard with full management capabilities
  - Other users → Public pages (rooms, booking)
- **Room Management**: View, filter, and search rooms with real-time data
- **Admin Dashboard**: Real-time statistics, room occupancy, booking management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **API Integration**: Complete integration with backend REST API

### Server Features

- **RESTful API**: Complete CRUD operations for users, rooms, and bookings
- **Authentication**: JWT-based authentication with role-based authorization
- **Database**: MySQL with Prisma ORM for type-safe database operations
- **Validation**: Input validation and error handling
- **Security**: CORS, Helmet, and secure password hashing
