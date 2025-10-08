import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function cleanupExpiredTokens() {
  const now = new Date();

  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } }, // expired tokens
          { revoked: true }, // revoked tokens
        ],
      },
    });

    console.log(`Deleted ${result.count} expired or revoked refresh tokens`);
  } catch (err) {
    console.error("rror cleaning tokens:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// run cleanup immediately
cleanupExpiredTokens();
