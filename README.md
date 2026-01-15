# Hotel Management System

A complete full-stack hotel management system with REST API backend and modern web frontend.

## Quick Start

### Option 1: Docker (Recommended)

#### Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 3001, and 3306 available

#### Step 1: Start MySQL Database Container

If you don't have a MySQL container yet, create it:

```bash
# Pull MySQL image (if not already pulled)
docker pull mysql:8.0

# Create and start MySQL container
docker run --name hotel-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=hotel_management \
  -e MYSQL_USER=hotel_user \
  -e MYSQL_PASSWORD=hotel_password \
  -p 3306:3306 \
  -d mysql:8.0
```

**If the container already exists, just start it:**

```bash
docker start hotel-mysql
```

**Verify MySQL is running:**

```bash
docker ps
```

#### Step 2: Start Server Container

```bash
# Start server in production mode
docker-compose up -d
```

**Access points:**

- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/api/health
- **Frontend:** http://localhost:3001 (if running separately)
- **MySQL:** localhost:3306

#### Step 3: Initialize Database (First Time Only)

If this is the first time running, set up the database schema and seed data:

```bash
# Enter the server container
docker exec -it hotel-server bash

# Inside the container, run:
npx prisma db push
npx prisma db seed

# Exit container
exit
```

**Or run from host (if you have Prisma installed locally):**

```bash
cd server
npx prisma db push
npx prisma db seed
```

#### Quick Commands

**Start Everything:**

```bash
docker start hotel-mysql
docker-compose up -d
```

**Restart Everything:**

```bash
docker restart hotel-mysql
docker-compose restart
```

**Stop Everything:**

```bash
docker-compose down
docker stop hotel-mysql
```

**View Logs:**

```bash
# Server logs
docker-compose logs -f

# MySQL logs
docker logs hotel-mysql
```

#### Development Mode (Optional - with hot reload)

If you want hot reload and development features:

```bash
# Start with hot reload (uses docker-compose.dev.yml)
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Note:** Development mode creates a separate MySQL container (`hotel-mysql-dev`) and runs on port 3002.

**Development Access Points:**

- **Backend API:** http://localhost:3002
- **Swagger Docs:** http://localhost:3002/api-docs

---

### Option 2: Manual Setup

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

---

## Docker Commands Reference

### Server Management

```bash
# Start server
docker-compose up -d

# Restart server
docker-compose restart

# Stop server
docker-compose down

# View server logs
docker-compose logs -f

# Rebuild server after changes
docker-compose up -d --build
```

### MySQL Management

```bash
# Start MySQL
docker start hotel-mysql

# Restart MySQL
docker restart hotel-mysql

# Stop MySQL
docker stop hotel-mysql

# Access MySQL shell
docker exec -it hotel-mysql mysql -u hotel_user -p hotel_management
# Password: hotel_password

# View MySQL logs
docker logs hotel-mysql

# Get MySQL container IP (if needed)
docker inspect hotel-mysql --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

### Container Management

```bash
# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# Access server container shell
docker exec -it hotel-server bash

# Access MySQL container shell
docker exec -it hotel-mysql bash
```

---

## Troubleshooting

### MySQL Container Not Found

If you get an error about `hotel-mysql` not existing:

```bash
# Check if container exists
docker ps -a | grep hotel-mysql

# If it doesn't exist, create it (see Step 1 in Quick Start)
# If it exists but is stopped, start it:
docker start hotel-mysql
```

### Connection Refused

If the server can't connect to MySQL:

1. **Check MySQL is running:**

   ```bash
   docker ps | grep hotel-mysql
   ```

2. **Check MySQL IP address:**

   ```bash
   docker inspect hotel-mysql --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
   ```

3. **Update DATABASE_URL** in `docker-compose.yml` if IP changed (currently set to `172.17.0.3`)

4. **Check MySQL logs:**
   ```bash
   docker logs hotel-mysql
   ```

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :3000

# Check what's using the port (Mac/Linux)
lsof -i :3000

# Stop the conflicting service or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# Check container logs
docker logs hotel-server

# Rebuild container
docker-compose up -d --build
```

### Database Not Initialized

If you see Prisma errors about missing tables:

```bash
# Enter container and run migrations
docker exec -it hotel-server bash
npx prisma db push
npx prisma db seed
exit
```

---

## Available Scripts

- `npm run install-all` - Install all dependencies (server + client)
- `npm run dev` - Start development server
- `npm run dev:client` - Start React client
- `npm run dev:both` - Start both server and client concurrently
- `npm run start` - Start production server
- `npm run setup` - Complete setup (install + database + seed)
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with dummy data

---

## Tech Stack

- **Backend:** Node.js, Express.js, MySQL, Prisma ORM
- **Frontend:** React 19, React Router DOM, Tailwind CSS
- **Authentication:** JWT with role-based authorization
- **Database:** MySQL with Docker support
- **Charts:** Recharts for dashboard visualizations
- **API Documentation:** Swagger/OpenAPI

---

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

- **RESTful API**: Complete CRUD operations for users, rooms, bookings, guests, rates, deals, and contact messages
- **Authentication**: JWT-based authentication with refresh tokens and role-based authorization
- **Database**: MySQL with Prisma ORM for type-safe database operations
- **Validation**: Input validation and error handling
- **Security**: CORS, Helmet, rate limiting, and secure password hashing
- **API Documentation**: Swagger/OpenAPI interactive documentation

---

## Documentation

- **API Documentation:** See `API_DOCUMENTATION.md` (complete API reference)
- **Swagger UI:** http://localhost:3000/api-docs (interactive API docs)
- **Google OAuth Setup:** See `GOOGLE_OAUTH_SETUP.md`
- **Server Documentation:** See `server/README.md`
- **Docker Setup:** See `server/DOCKER_SETUP.md`
- **Original Requirements:** See `server/project.txt`

---

## Default Test Credentials

After seeding the database:

- **Admin:** `admin` / `password123`
- **Manager:** `manager` / `password123`
- **User:** `john_doe` / `password123`
- **User:** `jane_smith` / `password123`

---

## Complete Startup Sequence (Fresh Install)

Here's the complete sequence for a fresh start:

```bash
# 1. Create and start MySQL
docker run --name hotel-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=hotel_management \
  -e MYSQL_USER=hotel_user \
  -e MYSQL_PASSWORD=hotel_password \
  -p 3306:3306 \
  -d mysql:8.0

# 2. Wait a few seconds for MySQL to start
sleep 5

# 3. Get MySQL IP (update docker-compose.yml if different from 172.17.0.3)
docker inspect hotel-mysql --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# 4. Start server
docker-compose up -d

# 5. Initialize database (first time only)
docker exec -it hotel-server bash
npx prisma db push
npx prisma db seed
exit

# 6. Check logs
docker-compose logs -f
```

---

## Access Points Summary

### Production Mode

- **API:** http://localhost:3000/api
- **Swagger:** http://localhost:3000/api-docs
- **Health:** http://localhost:3000/api/health

### Development Mode

- **API:** http://localhost:3002/api
- **Swagger:** http://localhost:3002/api-docs
- **Health:** http://localhost:3002/api/health

### MySQL

- **Host:** localhost
- **Port:** 3306
- **Database:** hotel_management
- **User:** hotel_user
- **Password:** hotel_password
