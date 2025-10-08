import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient();

const defaultRoomData = {
  SINGLE: {
    description: "Cozy single room with WiFi, workspace, and private bathroom.",
    features: ["wifi", "workspace", "private bathroom"],
    price: 80.0,
  },
  DOUBLE: {
    description:
      "Comfortable double room perfect for two guests, with WiFi and TV.",
    features: ["wifi", "tv", "balcony"],
    price: 120.0,
  },
  SUITE: {
    description:
      "Luxury suite with a living area, king bed, and premium amenities.",
    features: ["wifi", "king bed", "lounge area", "mini bar"],
    price: 200.0,
  },
  DELUXE: {
    description: "Elegant deluxe room with balcony, workspace, and city view.",
    features: ["wifi", "workspace", "balcony", "city view"],
    price: 300.0,
  },
};

async function createUsers() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  const users = [
    { username: "admin", role: "ADMIN" },
    { username: "manager", role: "MANAGER" },
    { username: "john_doe", role: "USER" },
    { username: "jane_smith", role: "USER" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        password: hashedPassword,
        role: u.role,
      },
    });
  }

  console.log("Users ensured");
}

async function createFeatures() {
  for (const type of Object.keys(defaultRoomData)) {
    const { features } = defaultRoomData[type];
    for (const f of features) {
      const fname = f.trim().toLowerCase();

      const feature = await prisma.roomFeature.upsert({
        where: { name: fname },
        update: {},
        create: { name: fname },
      });

      await prisma.roomTypeFeature.upsert({
        where: {
          roomType_featureId: { roomType: type, featureId: feature.id },
        },
        update: {},
        create: { roomType: type, featureId: feature.id },
      });
    }
  }

  console.log("Features + RoomTypeFeature seeded (lowercased)");
}

async function createRoomsDev() {
  await prisma.room.createMany({
    data: [
      {
        roomNumber: "101",
        type: "SINGLE",
        price: defaultRoomData.SINGLE.price,
        description: defaultRoomData.SINGLE.description,
        capacity: 1,
      },
      {
        roomNumber: "102",
        type: "SINGLE",
        price: defaultRoomData.SINGLE.price,
        description: defaultRoomData.SINGLE.description,
        capacity: 1,
      },
      {
        roomNumber: "201",
        type: "DOUBLE",
        price: defaultRoomData.DOUBLE.price,
        description: defaultRoomData.DOUBLE.description,
        capacity: 2,
      },
      {
        roomNumber: "202",
        type: "DOUBLE",
        price: defaultRoomData.DOUBLE.price,
        description: defaultRoomData.DOUBLE.description,
        capacity: 2,
      },
      {
        roomNumber: "301",
        type: "SUITE",
        price: defaultRoomData.SUITE.price,
        description: defaultRoomData.SUITE.description,
        capacity: 3,
      },
      {
        roomNumber: "302",
        type: "SUITE",
        price: defaultRoomData.SUITE.price,
        description: defaultRoomData.SUITE.description,
        capacity: 3,
      },
      {
        roomNumber: "401",
        type: "DELUXE",
        price: defaultRoomData.DELUXE.price,
        description: defaultRoomData.DELUXE.description,
        capacity: 3,
      },
      {
        roomNumber: "402",
        type: "DELUXE",
        price: defaultRoomData.DELUXE.price,
        description: defaultRoomData.DELUXE.description,
        capacity: 3,
      },
    ],
    skipDuplicates: true,
  });

  // Attach features per room
  const rooms = await prisma.room.findMany();
  for (const room of rooms) {
    const features = await prisma.roomTypeFeature.findMany({
      where: { roomType: room.type },
    });

    for (const f of features) {
      await prisma.roomFeatureMap.upsert({
        where: {
          roomId_featureId: { roomId: room.id, featureId: f.featureId },
        },
        update: {},
        create: { roomId: room.id, featureId: f.featureId },
      });
    }
  }

  console.log("Rooms seeded + features linked");
}

async function createRates() {
  const rooms = await prisma.room.findMany();

  for (const room of rooms) {
    const basePrice = parseFloat(room.price);
    const policies = ["FLEXIBLE", "STRICT", "NON_REFUNDABLE"];
    const policy = policies[room.id % policies.length]; // rotate

    await prisma.rate.upsert({
      where: { roomId_policy: { roomId: room.id, policy } },
      update: {},
      create: {
        roomId: room.id,
        policy,
        rate: basePrice,
        dealPrice: basePrice * 0.9,
        availability: 3,
      },
    });
  }

  console.log("Rates seeded");
}

async function main() {
  console.log("Starting seed...");

  if (process.env.NODE_ENV === "development") {
    console.log("Development mode: resetting...");

    await prisma.booking.deleteMany();
    await prisma.rate.deleteMany();
    await prisma.roomFeatureMap.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();
    await prisma.roomFeature.deleteMany();
    await prisma.roomTypeFeature.deleteMany();

    await createUsers();
    await createFeatures();
    await createRoomsDev();
    await createRates();
  } else {
    console.log("Production mode: only ensuring users, features, and rates");
    await createUsers();
    await createFeatures();
    await createRates();
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
