import { prisma } from "./prisma.config";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin user already exists
  const existingAdmin = await prisma.dashboardUser.findUnique({
    where: { email: "admin@viirtue.local" },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists, skipping seed");
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash("Admin1234!", 12);

  const admin = await prisma.dashboardUser.create({
    data: {
      email: "admin@viirtue.local",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      preferences: {
        create: {
          darkMode: true,
          refreshInterval: 30,
          defaultView: "overview",
          notificationsOn: true,
        },
      },
    },
    include: {
      preferences: true,
    },
  });

  console.log("✅ Created admin user:", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  console.log("\n📝 Login credentials:");
  console.log("  Email: admin@viirtue.local");
  console.log("  Password: Admin1234!");
  console.log("\n⚠️  IMPORTANT: Change this password after first login!\n");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
