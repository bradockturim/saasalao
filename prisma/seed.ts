import { PrismaClient, UserRole, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const salon = await prisma.salon.upsert({
    where: { slug: "demo-salon" },
    update: {},
    create: {
      name: "Salão Demo",
      slug: "demo-salon",
      email: "contato@demo-salon.com",
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      plan: Plan.PROFESSIONAL,
    },
  });

  const hashedPassword = await bcrypt.hash("senha123", 12);

  await prisma.user.upsert({
    where: { email_salonId: { email: "admin@demo-salon.com", salonId: salon.id } },
    update: {},
    create: {
      salonId: salon.id,
      name: "Admin Demo",
      email: "admin@demo-salon.com",
      password: hashedPassword,
      role: UserRole.OWNER,
    },
  });

  const category = await prisma.serviceCategory.create({
    data: {
      salonId: salon.id,
      name: "Cabelo",
      color: "#8B5CF6",
    },
  });

  await prisma.service.createMany({
    data: [
      { salonId: salon.id, categoryId: category.id, name: "Corte Feminino", duration: 60, price: 80 },
      { salonId: salon.id, categoryId: category.id, name: "Corte Masculino", duration: 30, price: 45 },
      { salonId: salon.id, categoryId: category.id, name: "Escova", duration: 45, price: 60 },
      { salonId: salon.id, categoryId: category.id, name: "Coloração", duration: 120, price: 180 },
    ],
  });

  const days = [
    { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 6, openTime: "09:00", closeTime: "14:00" },
    { dayOfWeek: 0, openTime: "09:00", closeTime: "12:00", isOpen: false },
  ];

  for (const day of days) {
    await prisma.workingHour.upsert({
      where: { salonId_dayOfWeek: { salonId: salon.id, dayOfWeek: day.dayOfWeek } },
      update: {},
      create: { salonId: salon.id, ...day },
    });
  }

  console.log("✅ Seed concluído!");
  console.log(`   Salão: ${salon.name} (slug: ${salon.slug})`);
  console.log("   Login: admin@demo-salon.com / senha123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
