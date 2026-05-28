import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const SALON_ID = "cmpncer6w0000i9dkd4ddv0ot";

async function main() {
  console.log("🌱 Seedando salao-do-pedro...\n");

  // ── Horários de funcionamento ──────────────────────────────────────────────
  const days = [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "12:00", isOpen: false },
    { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isOpen: true },
    { dayOfWeek: 6, openTime: "09:00", closeTime: "15:00", isOpen: true },
  ];
  for (const d of days) {
    await db.workingHour.upsert({
      where: { salonId_dayOfWeek: { salonId: SALON_ID, dayOfWeek: d.dayOfWeek } },
      update: {},
      create: { salonId: SALON_ID, ...d },
    });
  }
  console.log("✓ Horários de funcionamento");

  // ── Categorias ─────────────────────────────────────────────────────────────
  const catCorte = await db.serviceCategory.upsert({
    where: { id: "pedro-corte" }, update: {},
    create: { id: "pedro-corte", salonId: SALON_ID, name: "Corte", color: "#8B5CF6" },
  });
  const catQuimica = await db.serviceCategory.upsert({
    where: { id: "pedro-quimica" }, update: {},
    create: { id: "pedro-quimica", salonId: SALON_ID, name: "Química", color: "#F97316" },
  });
  const catColoracao = await db.serviceCategory.upsert({
    where: { id: "pedro-coloracao" }, update: {},
    create: { id: "pedro-coloracao", salonId: SALON_ID, name: "Coloração", color: "#EAB308" },
  });
  const catTratamento = await db.serviceCategory.upsert({
    where: { id: "pedro-tratamento" }, update: {},
    create: { id: "pedro-tratamento", salonId: SALON_ID, name: "Tratamento", color: "#10B981" },
  });
  const catEstetica = await db.serviceCategory.upsert({
    where: { id: "pedro-estetica" }, update: {},
    create: { id: "pedro-estetica", salonId: SALON_ID, name: "Estética", color: "#EC4899" },
  });
  console.log("✓ Categorias (5)");

  // ── Serviços ───────────────────────────────────────────────────────────────
  type P = { hairLength: "SHORT" | "MEDIUM" | "LONG"; price: number; duration?: number };
  type S = {
    name: string; categoryId: string; duration: number; price: number;
    hasPricingByLength?: boolean; activeTime?: number; requiresVirginHairCheck?: boolean;
    description?: string; pricings?: P[];
  };

  const services: S[] = [
    // Corte
    {
      name: "Corte Feminino", categoryId: catCorte.id, duration: 60, price: 80,
      description: "Corte personalizado com lavagem e secagem",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 70, duration: 45 },
        { hairLength: "MEDIUM", price: 80, duration: 60 },
        { hairLength: "LONG", price: 100, duration: 75 },
      ],
    },
    {
      name: "Corte Masculino", categoryId: catCorte.id, duration: 30, price: 50,
      description: "Corte com lavagem e finalização",
    },
    {
      name: "Corte Infantil", categoryId: catCorte.id, duration: 30, price: 40,
      description: "Corte para crianças até 10 anos",
    },
    {
      name: "Escova Simples", categoryId: catCorte.id, duration: 60, price: 75,
      description: "Escova modeladora com difusor ou chapinha",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 55, duration: 35 },
        { hairLength: "MEDIUM", price: 75, duration: 60 },
        { hairLength: "LONG", price: 105, duration: 80 },
      ],
    },
    {
      name: "Corte + Escova", categoryId: catCorte.id, duration: 90, price: 130,
      description: "Corte feminino com lavagem e escova completa",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 100, duration: 60 },
        { hairLength: "MEDIUM", price: 130, duration: 90 },
        { hairLength: "LONG", price: 165, duration: 120 },
      ],
    },
    // Química
    {
      name: "Progressiva Brasileira", categoryId: catQuimica.id,
      duration: 180, price: 280, activeTime: 60, requiresVirginHairCheck: true,
      description: "Alisamento duradouro com queratina",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 220, duration: 120 },
        { hairLength: "MEDIUM", price: 280, duration: 180 },
        { hairLength: "LONG", price: 360, duration: 240 },
      ],
    },
    {
      name: "Relaxamento", categoryId: catQuimica.id,
      duration: 90, price: 180, activeTime: 30, requiresVirginHairCheck: true,
      description: "Relaxamento dos fios para reduzir volume",
    },
    {
      name: "Botox Capilar", categoryId: catQuimica.id,
      duration: 150, price: 220, activeTime: 45,
      description: "Tratamento intensivo que sela os fios e reduz volume",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 180, duration: 100 },
        { hairLength: "MEDIUM", price: 220, duration: 150 },
        { hairLength: "LONG", price: 290, duration: 180 },
      ],
    },
    // Coloração
    {
      name: "Coloração Simples", categoryId: catColoracao.id,
      duration: 90, price: 150, activeTime: 30, requiresVirginHairCheck: true,
      description: "Cobertura de fios brancos ou mudança de tom",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 120, duration: 60 },
        { hairLength: "MEDIUM", price: 150, duration: 90 },
        { hairLength: "LONG", price: 200, duration: 120 },
      ],
    },
    {
      name: "Luzes / Mechas", categoryId: catColoracao.id,
      duration: 150, price: 320, activeTime: 50, requiresVirginHairCheck: true,
      description: "Mechas com papel alumínio. Profissional livre durante o tempo de ação",
      hasPricingByLength: true,
      pricings: [
        { hairLength: "SHORT", price: 250, duration: 100 },
        { hairLength: "MEDIUM", price: 320, duration: 150 },
        { hairLength: "LONG", price: 420, duration: 180 },
      ],
    },
    {
      name: "Balayage", categoryId: catColoracao.id,
      duration: 180, price: 480, activeTime: 60, requiresVirginHairCheck: true,
      description: "Iluminação degradê artesanal",
    },
    {
      name: "Tonalização", categoryId: catColoracao.id,
      duration: 75, price: 120, activeTime: 20,
      description: "Mudança de tonalidade sem levantamento da cor base",
    },
    {
      name: "Descoloração Parcial", categoryId: catColoracao.id,
      duration: 90, price: 130, activeTime: 30, requiresVirginHairCheck: true,
      description: "Clareamento de mechas ou raiz",
    },
    // Tratamento
    {
      name: "Hidratação", categoryId: catTratamento.id,
      duration: 60, price: 80, activeTime: 15,
      description: "Máscara hidratante com vapor",
    },
    {
      name: "Nutrição Capilar", categoryId: catTratamento.id,
      duration: 60, price: 90, activeTime: 15,
      description: "Tratamento com óleos e proteínas para fios ressecados",
    },
    {
      name: "Cronograma Capilar", categoryId: catTratamento.id,
      duration: 120, price: 150, activeTime: 30,
      description: "Protocolo completo: umectação, hidratação e nutrição",
    },
    {
      name: "Cauterização", categoryId: catTratamento.id,
      duration: 120, price: 160, activeTime: 30,
      description: "Selamento dos fios com proteínas e queratina",
    },
    // Estética
    {
      name: "Manicure", categoryId: catEstetica.id, duration: 45, price: 35,
      description: "Limpeza, cutícula e esmaltação das mãos",
    },
    {
      name: "Pedicure", categoryId: catEstetica.id, duration: 60, price: 45,
      description: "Limpeza, cutícula, calos e esmaltação dos pés",
    },
    {
      name: "Design de Sobrancelha", categoryId: catEstetica.id, duration: 30, price: 35,
      description: "Modelagem com linha e pinça",
    },
    {
      name: "Manicure + Pedicure", categoryId: catEstetica.id, duration: 90, price: 70,
      description: "Combo completo mãos e pés",
    },
  ];

  let svcCount = 0;
  for (const { pricings, ...svc } of services) {
    const exists = await db.service.findFirst({ where: { salonId: SALON_ID, name: svc.name } });
    if (!exists) {
      await db.service.create({
        data: {
          salonId: SALON_ID,
          ...svc,
          pricings: pricings?.length
            ? { create: pricings.map((p) => ({ salonId: SALON_ID, ...p })) }
            : undefined,
        },
      });
      svcCount++;
    }
  }
  console.log(`✓ Serviços (${svcCount} criados, ${services.length - svcCount} já existiam)`);

  // ── Profissionais ──────────────────────────────────────────────────────────
  type EmpInput = { id: string; name: string; role: string; color: string; phone?: string };
  const empList: EmpInput[] = [
    { id: "pedro-emp-ana-paula",     name: "Ana Paula",       role: "Cabeleireira Sênior",  color: "#8B5CF6", phone: "22991110001" },
    { id: "pedro-emp-juliana-costa", name: "Juliana Costa",   role: "Colorista",             color: "#F97316", phone: "22991110002" },
    { id: "pedro-emp-fernanda-lima", name: "Fernanda Lima",   role: "Cabeleireira",          color: "#10B981", phone: "22991110003" },
    { id: "pedro-emp-rodrigo-silva", name: "Rodrigo Silva",   role: "Barbeiro",              color: "#3B82F6", phone: "22991110004" },
    { id: "pedro-emp-camila-souza",  name: "Camila Souza",    role: "Manicure / Pedicure",   color: "#EC4899", phone: "22991110005" },
  ];
  const createdEmps: { id: string; name: string }[] = [];
  for (const emp of empList) {
    const e = await db.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: { salonId: SALON_ID, isActive: true, ...emp },
    });
    createdEmps.push(e);
  }
  console.log(`✓ Profissionais (${createdEmps.length})`);

  // ── Clientes ───────────────────────────────────────────────────────────────
  type ClientInput = {
    name: string; phone: string; email?: string;
    hairType?: "STRAIGHT" | "WAVY_CURLY"; hairLength?: "SHORT" | "MEDIUM" | "LONG";
    notes?: string;
  };
  const clientList: ClientInput[] = [
    { name: "Maria Santos",     phone: "22981001001", email: "maria.santos@email.com",  hairType: "STRAIGHT",   hairLength: "LONG",   notes: "Prefere corte em pontas" },
    { name: "Joana Ferreira",   phone: "22981001002", email: "joana.f@gmail.com",       hairType: "WAVY_CURLY", hairLength: "MEDIUM" },
    { name: "Camila Rocha",     phone: "22981001003",                                   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Beatriz Oliveira", phone: "22981001004", email: "bia.oliveira@email.com",  hairType: "WAVY_CURLY", hairLength: "LONG",   notes: "Alergia a amônia" },
    { name: "Larissa Mendes",   phone: "22981001005",                                   hairType: "STRAIGHT",   hairLength: "MEDIUM" },
    { name: "Patricia Alves",   phone: "22981001006", email: "patricia@email.com",      hairType: "WAVY_CURLY", hairLength: "SHORT" },
    { name: "Fernanda Ramos",   phone: "22981001007",                                   hairType: "STRAIGHT",   hairLength: "LONG" },
    { name: "Isabela Nunes",    phone: "22981001008", email: "isabela.n@gmail.com",     hairType: "STRAIGHT",   hairLength: "MEDIUM" },
    { name: "Vanessa Cruz",     phone: "22981001009",                                   hairType: "WAVY_CURLY", hairLength: "LONG",   notes: "Cliente VIP" },
    { name: "Tatiane Borges",   phone: "22981001010", email: "tati.borges@email.com",   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Carlos Alberto",   phone: "22981001011",                                   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Rafael Dias",      phone: "22981001012",                                   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Lucas Pereira",    phone: "22981001013", email: "lucas.p@email.com",       hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Eduardo Martins",  phone: "22981001014",                                   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Felipe Carvalho",  phone: "22981001015",                                   hairType: "STRAIGHT",   hairLength: "SHORT" },
    { name: "Renata Souza",     phone: "22981001016", email: "renata.s@email.com",      hairType: "WAVY_CURLY", hairLength: "MEDIUM" },
    { name: "Gabriela Lima",    phone: "22981001017",                                   hairType: "STRAIGHT",   hairLength: "LONG" },
    { name: "Amanda Fonseca",   phone: "22981001018", email: "amanda.f@gmail.com",      hairType: "WAVY_CURLY", hairLength: "SHORT" },
    { name: "Priscila Moura",   phone: "22981001019",                                   hairType: "STRAIGHT",   hairLength: "MEDIUM" },
    { name: "Daniela Castro",   phone: "22981001020", email: "dani.castro@email.com",   hairType: "WAVY_CURLY", hairLength: "LONG",   notes: "Gestante — evitar químicas" },
  ];
  const createdClients: { id: string; name: string }[] = [];
  for (const c of clientList) {
    const client = await db.client.upsert({
      where: { salonId_phone: { salonId: SALON_ID, phone: c.phone } },
      update: {},
      create: { salonId: SALON_ID, isActive: true, ...c },
    });
    createdClients.push(client);
  }
  console.log(`✓ Clientes (${createdClients.length})`);

  // ── Agendamentos de exemplo ────────────────────────────────────────────────
  // Pega IDs dos serviços criados
  const allSvcs = await db.service.findMany({ where: { salonId: SALON_ID } });
  const svcMap = Object.fromEntries(allSvcs.map((s) => [s.name, s]));

  const [anaP, juliana, fernanda, rodrigo, camila] = createdEmps;
  const clientMap = Object.fromEntries(createdClients.map((c) => [c.name, c]));

  // Datas espalhadas nas últimas 2 semanas e próxima semana
  function makeDate(offsetDays: number, hour: number, min = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, min, 0, 0);
    return d;
  }
  function addMin(d: Date, m: number) {
    return new Date(d.getTime() + m * 60000);
  }

  type AptInput = {
    clientName: string; empId: string; svcName: string;
    offsetDays: number; hour: number; min?: number; status?: string;
  };

  const aptDefs: AptInput[] = [
    // Passados (COMPLETED)
    { clientName:"Maria Santos",     empId:anaP.id,     svcName:"Corte + Escova",         offsetDays:-13, hour:9,  status:"COMPLETED" },
    { clientName:"Joana Ferreira",   empId:juliana.id,  svcName:"Coloração Simples",      offsetDays:-12, hour:10, status:"COMPLETED" },
    { clientName:"Beatriz Oliveira", empId:juliana.id,  svcName:"Luzes / Mechas",         offsetDays:-11, hour:14, status:"COMPLETED" },
    { clientName:"Camila Rocha",     empId:fernanda.id, svcName:"Escova Simples",         offsetDays:-10, hour:9, min:30, status:"COMPLETED" },
    { clientName:"Carlos Alberto",   empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:-10, hour:11, status:"COMPLETED" },
    { clientName:"Patricia Alves",   empId:camila.id,   svcName:"Manicure + Pedicure",    offsetDays:-9,  hour:15, status:"COMPLETED" },
    { clientName:"Larissa Mendes",   empId:anaP.id,     svcName:"Corte Feminino",         offsetDays:-8,  hour:10, status:"COMPLETED" },
    { clientName:"Rafael Dias",      empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:-7,  hour:9, status:"COMPLETED" },
    { clientName:"Isabela Nunes",    empId:fernanda.id, svcName:"Hidratação",             offsetDays:-7,  hour:14, status:"COMPLETED" },
    { clientName:"Vanessa Cruz",     empId:juliana.id,  svcName:"Balayage",               offsetDays:-6,  hour:10, status:"COMPLETED" },
    { clientName:"Fernanda Ramos",   empId:anaP.id,     svcName:"Progressiva Brasileira", offsetDays:-5,  hour:9, status:"COMPLETED" },
    { clientName:"Lucas Pereira",    empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:-5,  hour:11, status:"COMPLETED" },
    { clientName:"Tatiane Borges",   empId:camila.id,   svcName:"Pedicure",               offsetDays:-4,  hour:13, status:"COMPLETED" },
    { clientName:"Renata Souza",     empId:juliana.id,  svcName:"Tonalização",            offsetDays:-4,  hour:15, status:"COMPLETED" },
    { clientName:"Eduardo Martins",  empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:-3,  hour:10, status:"COMPLETED" },
    { clientName:"Maria Santos",     empId:anaP.id,     svcName:"Hidratação",             offsetDays:-3,  hour:14, status:"COMPLETED" },
    { clientName:"Gabriela Lima",    empId:fernanda.id, svcName:"Corte + Escova",         offsetDays:-2,  hour:9, status:"COMPLETED" },
    { clientName:"Amanda Fonseca",   empId:camila.id,   svcName:"Manicure",               offsetDays:-2,  hour:11, status:"COMPLETED" },
    { clientName:"Joana Ferreira",   empId:juliana.id,  svcName:"Botox Capilar",          offsetDays:-1,  hour:10, status:"COMPLETED" },
    { clientName:"Felipe Carvalho",  empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:-1,  hour:14, status:"COMPLETED" },
    // Hoje
    { clientName:"Maria Santos",     empId:anaP.id,     svcName:"Escova Simples",         offsetDays:0,  hour:9,  status:"CONFIRMED" },
    { clientName:"Carlos Alberto",   empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:0,  hour:10, status:"CONFIRMED" },
    { clientName:"Priscila Moura",   empId:fernanda.id, svcName:"Corte Feminino",         offsetDays:0,  hour:11, status:"IN_PROGRESS" },
    { clientName:"Patricia Alves",   empId:camila.id,   svcName:"Manicure + Pedicure",    offsetDays:0,  hour:13, status:"SCHEDULED" },
    { clientName:"Beatriz Oliveira", empId:juliana.id,  svcName:"Coloração Simples",      offsetDays:0,  hour:14, status:"SCHEDULED" },
    // Próximos
    { clientName:"Vanessa Cruz",     empId:juliana.id,  svcName:"Luzes / Mechas",         offsetDays:1,  hour:9  },
    { clientName:"Gabriela Lima",    empId:anaP.id,     svcName:"Corte + Escova",         offsetDays:1,  hour:10 },
    { clientName:"Rafael Dias",      empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:1,  hour:11 },
    { clientName:"Amanda Fonseca",   empId:camila.id,   svcName:"Pedicure",               offsetDays:1,  hour:14 },
    { clientName:"Daniela Castro",   empId:fernanda.id, svcName:"Hidratação",             offsetDays:2,  hour:9  },
    { clientName:"Larissa Mendes",   empId:anaP.id,     svcName:"Corte Feminino",         offsetDays:2,  hour:10 },
    { clientName:"Lucas Pereira",    empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:2,  hour:11 },
    { clientName:"Isabela Nunes",    empId:juliana.id,  svcName:"Tonalização",            offsetDays:3,  hour:10 },
    { clientName:"Tatiane Borges",   empId:camila.id,   svcName:"Manicure",               offsetDays:3,  hour:11 },
    { clientName:"Fernanda Ramos",   empId:anaP.id,     svcName:"Progressiva Brasileira", offsetDays:4,  hour:9  },
    { clientName:"Joana Ferreira",   empId:juliana.id,  svcName:"Balayage",               offsetDays:5,  hour:10 },
    { clientName:"Eduardo Martins",  empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:5,  hour:14 },
    { clientName:"Renata Souza",     empId:fernanda.id, svcName:"Escova Simples",         offsetDays:6,  hour:9  },
    { clientName:"Felipe Carvalho",  empId:rodrigo.id,  svcName:"Corte Masculino",        offsetDays:7,  hour:10 },
    { clientName:"Priscila Moura",   empId:anaP.id,     svcName:"Corte + Escova",         offsetDays:7,  hour:11 },
  ];

  let aptCount = 0;
  for (const def of aptDefs) {
    const svc = svcMap[def.svcName];
    const client = clientMap[def.clientName];
    if (!svc || !client) { console.warn("SKIP", def.svcName, def.clientName); continue; }

    const startsAt = makeDate(def.offsetDays, def.hour, def.min ?? 0);
    const endsAt = addMin(startsAt, svc.duration);
    const status = (def.status ?? "SCHEDULED") as any;

    // Check if already exists (avoid duplicates on re-run)
    const exists = await db.appointment.findFirst({
      where: { salonId: SALON_ID, clientId: client.id, employeeId: def.empId, startsAt },
    });
    if (exists) continue;

    await db.appointment.create({
      data: {
        salonId: SALON_ID,
        clientId: client.id,
        employeeId: def.empId,
        startsAt,
        endsAt,
        totalPrice: svc.price,
        status,
        services: {
          create: {
            serviceId: svc.id,
            price: svc.price,
            duration: svc.duration,
            activeTime: svc.activeTime ?? null,
          },
        },
      },
    });
    aptCount++;
  }
  console.log(`✓ Agendamentos (${aptCount} criados)`);

  console.log("\n✅ Seed concluído para salao-do-pedro!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
