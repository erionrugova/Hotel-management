// prisma/seed.js
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      username: "manager",
      password: hashedPassword,
      role: "MANAGER",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      username: "john_doe",
      password: hashedPassword,
      role: "USER",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "jane_smith",
      password: hashedPassword,
      role: "USER",
    },
  });

  console.log("✅ Users created");

  // Create rooms
  const rooms = await prisma.room.createMany({
    data: [
      { roomNumber: "101", type: "SINGLE", price: 80.0, status: "AVAILABLE" },
      { roomNumber: "102", type: "SINGLE", price: 80.0, status: "AVAILABLE" },
      { roomNumber: "201", type: "DOUBLE", price: 120.0, status: "AVAILABLE" },
      { roomNumber: "202", type: "DOUBLE", price: 120.0, status: "OCCUPIED" },
      { roomNumber: "301", type: "SUITE", price: 200.0, status: "AVAILABLE" },
      { roomNumber: "302", type: "SUITE", price: 200.0, status: "MAINTENANCE" },
      { roomNumber: "401", type: "DELUXE", price: 300.0, status: "AVAILABLE" },
      {
        roomNumber: "402",
        type: "DELUXE",
        price: 300.0,
        status: "OUT_OF_ORDER",
      },
      { roomNumber: "501", type: "SINGLE", price: 90.0, status: "AVAILABLE" },
      { roomNumber: "502", type: "DOUBLE", price: 140.0, status: "AVAILABLE" },
    ],
  });

  console.log("✅ Rooms created");

  // Get created rooms for booking references
  const roomList = await prisma.room.findMany();
  const room101 = roomList.find((r) => r.roomNumber === "101");
  const room201 = roomList.find((r) => r.roomNumber === "201");
  const room301 = roomList.find((r) => r.roomNumber === "301");
  const room401 = roomList.find((r) => r.roomNumber === "401");
  const room501 = roomList.find((r) => r.roomNumber === "501");

  // Create bookings
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.createMany({
    data: [
      {
        userId: user1.id,
        roomId: room101.id,
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: "CONFIRMED",
      },
      {
        userId: user2.id,
        roomId: room201.id,
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
      {
        userId: user1.id,
        roomId: room301.id,
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: "CONFIRMED",
      },
      {
        userId: user2.id,
        roomId: room401.id,
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: "COMPLETED",
      },
      {
        userId: user1.id,
        roomId: room501.id,
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        status: "CANCELLED",
      },
    ],
  });

  console.log("✅ Bookings created");

  // Update room 202 status to OCCUPIED (it has a confirmed booking)
  await prisma.room.update({
    where: { roomNumber: "202" },
    data: { status: "OCCUPIED" },
  });

  console.log("🎉 Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Users: 4 (1 Admin, 1 Manager, 2 Users)`);
  console.log(`- Rooms: 10 (various types and statuses)`);
  console.log(`- Bookings: 5 (different statuses and dates)`);
  console.log("\n🔑 Test Credentials:");
  console.log("Username: admin | Password: password123 (ADMIN)");
  console.log("Username: manager | Password: password123 (MANAGER)");
  console.log("Username: john_doe | Password: password123 (USER)");
  console.log("Username: jane_smith | Password: password123 (USER)");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
