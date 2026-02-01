import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const newPassword = process.argv[2] || "password123"; // Default to password123 if not provided
    
    if (newPassword.length < 6) {
      console.error("❌ Password must be at least 6 characters long");
      process.exit(1);
    }

    console.log(`🔄 Resetting admin password...`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: { username: "admin" },
      data: { password: hashedPassword },
      select: { id: true, username: true, role: true },
    });
    
    console.log(`✅ Admin password reset successfully!`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`\n💡 You can now login with username: admin, password: ${newPassword}`);
  } catch (error) {
    if (error.code === "P2025") {
      console.error("❌ Admin user not found. Make sure the database is seeded.");
    } else {
      console.error("❌ Error resetting password:", error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
