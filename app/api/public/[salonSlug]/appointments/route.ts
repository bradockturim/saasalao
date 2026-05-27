import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWhatsAppMessage, formatPhoneForWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  serviceId:  z.string(),
  employeeId: z.string(), // real ID or "any"
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:       z.string().regex(/^\d{2}:\d{2}$/),
  hairLength: z.enum(["SHORT", "MEDIUM", "LONG"]).optional().nullable(),
  hairType:   z.enum(["STRAIGHT", "WAVY_CURLY"]).optional().nullable(),
  notes:      z.string().optional().nullable(),
  client: z.object({
    name:  z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().nullable(),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      whatsappNotifyNew: true,
    },
  });
  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // ─── Service validation ──────────────────────────────────────────────────
    const service = await db.service.findFirst({
      where: { id: data.serviceId, salonId: salon.id, isActive: true },
      include: { pricings: true },
    });
    if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

    // ─── Resolve price + duration ────────────────────────────────────────────
    let price           = service.price;
    let durationMinutes = service.duration;
    if (data.hairLength && service.hasPricingByLength) {
      const pricing = service.pricings.find((p) => p.hairLength === data.hairLength);
      if (pricing) {
        price = pricing.price;
        if (pricing.duration) durationMinutes = pricing.duration;
      }
    }

    // ─── Build time range ────────────────────────────────────────────────────
    const [h, m] = data.time.split(":").map(Number);
    const startsAt = new Date(`${data.date}T00:00:00`);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);

    // ─── Resolve employee ────────────────────────────────────────────────────
    let resolvedEmployeeId: string;
    // staffId = client preference (null = sem preferência)
    const staffId: string | null = data.employeeId === "any" ? null : data.employeeId;

    if (data.employeeId === "any") {
      // Auto-assign: find active employees for this service
      let candidates = await db.employee.findMany({
        where: {
          salonId: salon.id,
          isActive: true,
          specialties: { has: service.name },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      if (candidates.length === 0) {
        candidates = await db.employee.findMany({
          where: {
            salonId: salon.id,
            isActive: true,
            services: { some: { serviceId: data.serviceId } },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      }

      if (candidates.length === 0) {
        candidates = await db.employee.findMany({
          where: { salonId: salon.id, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      }

      if (candidates.length === 0) {
        return NextResponse.json(
          { error: "Nenhum profissional disponível para este serviço." },
          { status: 409 }
        );
      }

      // Pick employee with fewest non-cancelled appointments on this day
      const dayStart = new Date(data.date + "T00:00:00");
      const dayEnd   = new Date(data.date + "T23:59:59");

      const counts = await Promise.all(
        candidates.map(async (emp) => ({
          id:    emp.id,
          count: await db.appointment.count({
            where: {
              employeeId: emp.id,
              startsAt: { gte: dayStart, lte: dayEnd },
              status: { notIn: ["CANCELLED", "NO_SHOW"] },
            },
          }),
        }))
      );

      // Sort by count ASC, name already ASC from query
      counts.sort((a, b) => a.count - b.count);

      // Among least-busy, find the first one with no conflict at the chosen slot
      let assigned: string | null = null;
      for (const { id } of counts) {
        const conflict = await db.appointment.findFirst({
          where: {
            employeeId: id,
            salonId: salon.id,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }],
          },
        });
        if (!conflict) { assigned = id; break; }
      }

      if (!assigned) {
        return NextResponse.json(
          { error: "Nenhum profissional disponível neste horário. Escolha outro." },
          { status: 409 }
        );
      }

      resolvedEmployeeId = assigned;
    } else {
      // Specific employee chosen
      const employee = await db.employee.findFirst({
        where: { id: data.employeeId, salonId: salon.id, isActive: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
      }

      const conflict = await db.appointment.findFirst({
        where: {
          salonId: salon.id,
          employeeId: data.employeeId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }],
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "Horário indisponível. Escolha outro." },
          { status: 409 }
        );
      }

      resolvedEmployeeId = data.employeeId;
    }

    // ─── Upsert client ───────────────────────────────────────────────────────
    const phone = data.client.phone.replace(/\D/g, "");
    const client = await db.client.upsert({
      where: { salonId_phone: { salonId: salon.id, phone } },
      update: {
        name:       data.client.name,
        email:      data.client.email,
        hairType:   data.hairType   ?? undefined,
        hairLength: data.hairLength ?? undefined,
      },
      create: {
        salonId:    salon.id,
        name:       data.client.name,
        phone,
        email:      data.client.email,
        hairType:   data.hairType   ?? undefined,
        hairLength: data.hairLength ?? undefined,
      },
    });

    // ─── Create appointment ──────────────────────────────────────────────────
    const appointment = await db.appointment.create({
      data: {
        salonId:    salon.id,
        clientId:   client.id,
        employeeId: resolvedEmployeeId,
        staffId,                        // null = sem preferência, ID = preferência
        startsAt,
        endsAt,
        totalPrice: price,
        notes:      data.notes,
        status:     "SCHEDULED",
        services: {
          create: {
            serviceId: data.serviceId,
            price,
            duration: durationMinutes,
          },
        },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    // ─── WhatsApp notification (fire-and-forget) ────────────────────────────
    if (salon.whatsappNotifyNew && salon.whatsappNumber) {
      const dateLabel = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day:     "2-digit",
        month:   "long",
      }).format(startsAt);

      const timeLabel = startsAt.toLocaleTimeString("pt-BR", {
        hour:   "2-digit",
        minute: "2-digit",
      });

      const serviceNames = appointment.services
        .map((s) => s.service.name)
        .join(", ");

      const message =
        `📅 *Novo agendamento — ${salon.name}*\n\n` +
        `👤 *Cliente:* ${appointment.client.name}\n` +
        `📞 *Telefone:* ${appointment.client.phone}\n` +
        `✂️ *Serviço:* ${serviceNames}\n` +
        `👩‍💼 *Profissional:* ${appointment.employee.name}\n` +
        `🗓️ *Data:* ${dateLabel}\n` +
        `🕐 *Horário:* ${timeLabel}\n` +
        `💰 *Valor:* R$ ${appointment.totalPrice.toFixed(2).replace(".", ",")}`;

      // Não bloqueia a resposta — falhas de WhatsApp não afetam o agendamento
      sendWhatsAppMessage(salon.whatsappNumber, message).catch((err) =>
        console.error("[WhatsApp notify]", err)
      );
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[PUBLIC APPOINTMENT]", error);
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 });
  }
}
