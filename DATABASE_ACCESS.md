# Database Access Guide

## Database System
Your hotel management system uses **MySQL** (not SQL Server/SSMS).

## Database Connection Details

The database runs in a Docker container named `hotel-mysql` on port `3306`.

## Accessing MySQL via Terminal

### Option 1: Access MySQL Container Directly

```bash
# Connect to the MySQL container
docker exec -it hotel-mysql mysql -u root -p

# When prompted, enter your MySQL root password
# (Check your .env file for the password, or use the default if set)
```

### Option 2: Connect from Host Machine

If you have MySQL client installed on your host machine:

```bash
mysql -h localhost -P 3306 -u root -p
```

### Option 3: Using Docker Compose

```bash
# If using docker-compose, you can access it via:
docker-compose exec mysql mysql -u root -p
```

## Common SQL Commands

Once connected, you can run SQL queries:

```sql
-- Show all databases
SHOW DATABASES;

-- Use your database (check your .env DATABASE_URL for the database name)
USE your_database_name;

-- Show all tables
SHOW TABLES;

-- View bookings table structure
DESCRIBE bookings;

-- View all bookings
SELECT * FROM bookings;

-- View bookings with related data
SELECT 
    b.id AS booking_id,
    b.customerFirstName,
    b.customerLastName,
    b.status,
    r.roomNumber,
    g.id AS guest_id,
    g.fullName AS guest_name
FROM bookings b
LEFT JOIN rooms r ON b.roomId = r.id
LEFT JOIN guests g ON g.bookingId = b.id
ORDER BY b.id DESC;

-- Count bookings by status
SELECT status, COUNT(*) as count 
FROM bookings 
GROUP BY status;

-- View guests with their booking IDs
SELECT 
    g.id AS guest_id,
    g.fullName,
    g.bookingId,
    b.id AS booking_id,
    b.customerFirstName,
    b.customerLastName
FROM guests g
LEFT JOIN bookings b ON g.bookingId = b.id;

-- Check database relationships
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'your_database_name'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Database Schema Relationships

Based on your Prisma schema:

- **Bookings** table has:
  - `id` (Primary Key)
  - `userId` (Foreign Key → Users.id)
  - `roomId` (Foreign Key → Rooms.id)
  - `dealId` (Foreign Key → Deals.id, nullable)

- **Guests** table has:
  - `id` (Primary Key)
  - `bookingId` (Foreign Key → Bookings.id, UNIQUE, CASCADE DELETE)
  - `roomId` (Foreign Key → Rooms.id, nullable)
  - `dealId` (Foreign Key → Deals.id, nullable)

**Important**: When a booking is deleted, the associated guest is automatically deleted (CASCADE).

## Finding Data by Booking ID

Since Booking ID is the primary identifier across all pages:

```sql
-- Find booking by ID
SELECT * FROM bookings WHERE id = 5;

-- Find guest by booking ID
SELECT * FROM guests WHERE bookingId = 5;

-- Find all related data for booking ID 5
SELECT 
    b.*,
    r.roomNumber,
    r.type AS room_type,
    g.fullName AS guest_name,
    g.email AS guest_email,
    u.username AS user_name
FROM bookings b
LEFT JOIN rooms r ON b.roomId = r.id
LEFT JOIN guests g ON g.bookingId = b.id
LEFT JOIN users u ON b.userId = u.id
WHERE b.id = 5;
```

## Exit MySQL

```sql
EXIT;
-- or
\q
```

## Troubleshooting

### Can't connect to MySQL
1. Check if container is running: `docker ps`
2. Check container logs: `docker logs hotel-mysql`
3. Verify port 3306 is not blocked

### Forgot password
Check your `.env` file in the server directory for `DATABASE_URL` or `MYSQL_ROOT_PASSWORD`.
