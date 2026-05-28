import { PrismaClient, UserRole, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const salon = await prisma.salon.upsert({
    where: { slug: "demo-salon" },
    update: {},
    create: {
      name: "Studio Bella",
      slug: "demo-salon",
      email: "contato@studiobella.com",
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

  // ─── Categories ──────────────────────────────────────────────────────────────

  const catCorte = await prisma.serviceCategory.upsert({
    where: { id: `${salon.id}-corte` },
    update: {},
    create: { id: `${salon.id}-corte`, salonId: salon.id, name: "Corte", color: "#8B5CF6" },
  });

  const catQuimica = await prisma.serviceCategory.upsert({
    where: { id: `${salon.id}-quimica` },
    update: {},
    create: { id: `${salon.id}-quimica`, salonId: salon.id, name: "Química", color: "#F97316" },
  });

  const catColoracao = await prisma.serviceCategory.upsert({
    where: { id: `${salon.id}-coloracao` },
    update: {},
    create: { id: `${salon.id}-coloracao`, salonId: salon.id, name: "Coloração", color: "#EAB308" },
  });

  const catTratamento = await prisma.serviceCategory.upsert({
    where: { id: `${salon.id}-tratamento` },
    update: {},
    create: { id: `${salon.id}-tratamento`, salonId: salon.id, name: "Tratamento", color: "#10B981" },
  });

  const catEstetica = await prisma.serviceCategory.upsert({
    where: { id: `${salon.id}-estetica` },
    update: {},
    create: { id: `${salon.id}-estetica`, salonId: salon.id, name: "Estética", color: "#EC4899" },
  });

  // ─── Services ─────────────────────────────────────────────────────────────────

  type ServiceInput = Parameters<typeof prisma.service.create>[0]["data"];

  const services: (ServiceInput & { pricingsData?: { hairLength: "SHORT" | "MEDIUM" | "LONG"; price: number; duration?: number }[] })[] = [

    // ── Corte ──────────────────────────────────────────────────────────────────
    {
      salonId: salon.id,
      categoryId: catCorte.id,
      name: "Corte Feminino",
      description: "Corte personalizado com lavagem e secagem",
      duration: 60,
      price: 80,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 70, duration: 45 },
        { hairLength: "MEDIUM", price: 80, duration: 60 },
        { hairLength: "LONG", price: 100, duration: 75 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catCorte.id,
      name: "Corte Masculino",
      description: "Corte com lavagem e finalização",
      duration: 30,
      price: 50,
    },
    {
      salonId: salon.id,
      categoryId: catCorte.id,
      name: "Corte Infantil",
      description: "Corte para crianças até 10 anos",
      duration: 30,
      price: 40,
    },
    {
      salonId: salon.id,
      categoryId: catCorte.id,
      name: "Escova Progressiva Simples",
      description: "Escova modeladora com difusor ou chapinha",
      duration: 60,
      price: 80,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 60, duration: 40 },
        { hairLength: "MEDIUM", price: 80, duration: 60 },
        { hairLength: "LONG", price: 110, duration: 75 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catCorte.id,
      name: "Corte + Escova",
      description: "Corte feminino com lavagem e escova completa",
      duration: 90,
      price: 130,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 110, duration: 60 },
        { hairLength: "MEDIUM", price: 130, duration: 90 },
        { hairLength: "LONG", price: 165, duration: 120 },
      ],
    },

    // ── Química ────────────────────────────────────────────────────────────────
    {
      salonId: salon.id,
      categoryId: catQuimica.id,
      name: "Progressiva Brasileira",
      description: "Alisamento duradouro com queratina. Profissional aplica o produto e a cliente aguarda a ação.",
      duration: 180,
      price: 280,
      activeTime: 60,          // professional applies for 60min, then client waits ~120min
      requiresVirginHairCheck: true,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 220, duration: 120 },
        { hairLength: "MEDIUM", price: 280, duration: 180 },
        { hairLength: "LONG", price: 360, duration: 240 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catQuimica.id,
      name: "Relaxamento",
      description: "Relaxamento dos fios para reduzir o volume e facilitar o manejo",
      duration: 90,
      price: 180,
      activeTime: 30,
      requiresVirginHairCheck: true,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 150, duration: 60 },
        { hairLength: "MEDIUM", price: 180, duration: 90 },
        { hairLength: "LONG", price: 240, duration: 120 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catQuimica.id,
      name: "Botox Capilar",
      description: "Tratamento intensivo que sela os fios e reduz volume. Inclui aplicação e ativação com calor.",
      duration: 150,
      price: 220,
      activeTime: 45,
      requiresVirginHairCheck: false,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 180, duration: 100 },
        { hairLength: "MEDIUM", price: 220, duration: 150 },
        { hairLength: "LONG", price: 290, duration: 180 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catQuimica.id,
      name: "Cauterização",
      description: "Selamento dos fios com proteínas e queratina para brilho e maciez",
      duration: 120,
      price: 160,
      activeTime: 30,
      requiresVirginHairCheck: false,
    },

    // ── Coloração ──────────────────────────────────────────────────────────────
    {
      salonId: salon.id,
      categoryId: catColoracao.id,
      name: "Coloração Simples",
      description: "Cobertura de fios brancos ou mudança de tom. Cliente aguarda o produto agir.",
      duration: 90,
      price: 150,
      activeTime: 30,
      requiresVirginHairCheck: true,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 120, duration: 60 },
        { hairLength: "MEDIUM", price: 150, duration: 90 },
        { hairLength: "LONG", price: 200, duration: 120 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catColoracao.id,
      name: "Luzes / Mechas",
      description: "Técnica de mechas com papel alumínio. Enquanto o produto age, a profissional fica disponível.",
      duration: 150,
      price: 320,
      activeTime: 50,           // professional applies for ~50min; client waits ~100min
      requiresVirginHairCheck: true,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 250, duration: 100 },
        { hairLength: "MEDIUM", price: 320, duration: 150 },
        { hairLength: "LONG", price: 420, duration: 180 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catColoracao.id,
      name: "Balayage",
      description: "Técnica de iluminação degradê artesanal. Produto aplicado manualmente.",
      duration: 180,
      price: 480,
      activeTime: 60,
      requiresVirginHairCheck: true,
      hasPricingByLength: true,
      pricingsData: [
        { hairLength: "SHORT", price: 380, duration: 130 },
        { hairLength: "MEDIUM", price: 480, duration: 180 },
        { hairLength: "LONG", price: 600, duration: 210 },
      ],
    },
    {
      salonId: salon.id,
      categoryId: catColoracao.id,
      name: "Tonalização",
      description: "Mudança de tonalidade sem levantamento da cor base",
      duration: 75,
      price: 120,
      activeTime: 20,
      requiresVirginHairCheck: false,
    },
    {
      salonId: salon.id,
      categoryId: catColoracao.id,
      name: "Descoloração Parcial",
      description: "Clareamento de mechas ou raiz. Requer análise prévia do histórico capilar.",
      duration: 90,
      price: 130,
      activeTime: 30,
      requiresVirginHairCheck: true,
    },

    // ── Tratamento ─────────────────────────────────────────────────────────────
    {
      salonId: salon.id,
      categoryId: catTratamento.id,
      name: "Hidratação",
      description: "Máscara hidratante com vapor para nutrição dos fios",
      duration: 60,
      price: 80,
      activeTime: 15,           // apply mask 15min, client waits 45min
    },
    {
      salonId: salon.id,
      categoryId: catTratamento.id,
      name: "Nutrição Capilar",
      description: "Tratamento com óleos e proteínas para fios ressecados",
      duration: 60,
      price: 90,
      activeTime: 15,
    },
    {
      salonId: salon.id,
      categoryId: catTratamento.id,
      name: "Cronograma Capilar",
      description: "Protocolo completo: umectação, hidratação e nutrição em sequência",
      duration: 120,
      price: 150,
      activeTime: 30,
    },

    // ── Estética ───────────────────────────────────────────────────────────────
    {
      salonId: salon.id,
      categoryId: catEstetica.id,
      name: "Manicure",
      description: "Limpeza, cutícula e esmaltação das unhas das mãos",
      duration: 45,
      price: 35,
    },
    {
      salonId: salon.id,
      categoryId: catEstetica.id,
      name: "Pedicure",
      description: "Limpeza, cutícula, calos e esmaltação das unhas dos pés",
      duration: 60,
      price: 45,
    },
    {
      salonId: salon.id,
      categoryId: catEstetica.id,
      name: "Design de Sobrancelha",
      description: "Modelagem com linha e pinça, com mapeamento personalizado",
      duration: 30,
      price: 35,
    },
    {
      salonId: salon.id,
      categoryId: catEstetica.id,
      name: "Manicure + Pedicure",
      description: "Combo completo mãos e pés com esmaltação à escolha",
      duration: 90,
      price: 70,
    },
  ];

  for (const svc of services) {
    const { pricingsData, ...serviceData } = svc as typeof svc & { pricingsData?: { hairLength: "SHORT" | "MEDIUM" | "LONG"; price: number; duration?: number }[] };

    const existing = await prisma.service.findFirst({
      where: { salonId: salon.id, name: serviceData.name as string },
    });

    if (!existing) {
      await prisma.service.create({
        data: {
          ...(serviceData as Parameters<typeof prisma.service.create>[0]["data"]),
          pricings: pricingsData?.length
            ? {
                create: pricingsData.map((p) => ({
                  salonId: salon.id,
                  hairLength: p.hairLength,
                  price: p.price,
                  duration: p.duration ?? null,
                })),
              }
            : undefined,
        },
      });
    }
  }

  // ─── Working Hours ────────────────────────────────────────────────────────────

  const days = [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "12:00", isOpen: false },
    { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 6, openTime: "09:00", closeTime: "15:00", isOpen: true },
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
  console.log(`   Serviços criados: ${services.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
