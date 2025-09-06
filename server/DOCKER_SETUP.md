# Docker Setup for Hotel Management System

This guide will help you set up a MySQL database using Docker for testing the Hotel Management System API.

## 🐳 **Docker MySQL Commands**

### **1. Pull MySQL Image**

```bash
docker pull mysql:8.0
```

### **2. Run MySQL Container**

```bash
docker run --name hotel-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=hotel_management \
  -e MYSQL_USER=hotel_user \
  -e MYSQL_PASSWORD=hotel_password \
  -p 3306:3306 \
  -d mysql:8.0
```

### **3. Verify Container is Running**

```bash
docker ps
```

### **4. Connect to MySQL (Optional)**

```bash
docker exec -it hotel-mysql mysql -u hotel_user -p hotel_management
```

_Password: `hotel_password`_

### **5. Stop Container (when done testing)**

```bash
docker stop hotel-mysql
```

### **6. Remove Container (cleanup)**

```bash
docker rm hotel-mysql
```

## ⚙️ **Environment Configuration**

Copy the environment file:

```bash
cp server/config.env server/.env
```

The `.env` file contains:

```env
DATABASE_URL="mysql://hotel_user:hotel_password@localhost:3306/hotel_management"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

## 🚀 **Testing Your API**

After running MySQL:

1. **Install server dependencies:**

   ```bash
   npm run install-server
   ```

2. **Complete setup (database + seed data):**

   ```bash
   npm run setup
   ```

3. **Start your API:**

   ```bash
   npm run dev
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## 📝 **Quick Test Commands**

### **Test Credentials (after seeding):**

- **Admin:** `admin` / `password123`
- **Manager:** `manager` / `password123`
- **User:** `john_doe` / `password123`
- **User:** `jane_smith` / `password123`

### **Login with seeded user:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

### **Create a room (use token from login):**

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"roomNumber": "101", "type": "SINGLE", "price": 100.00}'
```

## 🔧 **Troubleshooting**

### **Container won't start:**

- Check if port 3306 is already in use: `lsof -i :3306`
- Use a different port: `-p 3307:3306`

### **Connection refused:**

- Wait a few seconds for MySQL to fully start
- Check container logs: `docker logs hotel-mysql`

### **Database connection error:**

- Verify your `.env` file has the correct credentials
- Ensure the container is running: `docker ps`

## 📊 **Database Persistence**

The MySQL container will persist data between restarts. To completely reset:

```bash
docker stop hotel-mysql
docker rm hotel-mysql
# Then run the docker run command again
```

## 🎯 **Next Steps**

Once your database is running and the API is started:

1. Test all endpoints using the provided curl commands
2. Use Postman or similar tools for more comprehensive testing
3. Check the Prisma Studio: `npx prisma studio` (opens at http://localhost:5555)
