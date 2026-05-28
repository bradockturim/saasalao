import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWhatsAppMessage, formatPhoneForWhatsApp } from "@/lib/whatsapp";

// ─── Conflict detection helpers ──────────────────────────────────────────────

type AptForConflict = { startsAt: Date; endsAt: Date; services: { activeTime: number | null }[] };

/** Returns the end of the professional's active window.
 *  For concurrent services (e.g. highlights), the professional is free after activeTime minutes. */
function profEndsAt(apt: AptForConflict): Date {
  const times = apt.services.map((s) => s.activeTime).filter((t): t is number => t != null);
  if (times.length === 0) return apt.endsAt;
  const end = new Date(apt.startsAt);
  end.setMinutes(end.getMinutes() + Math.max(...times));
  return end;
}

function hasConflict(apt: AptForConflict, newStart: Date, newEnd: Date): boolean {
  return newStart < profEndsAt(apt) && newEnd > apt.startsAt;
}

const aptServiceSelect = { services: { select: { activeTime: true } } } as const;

// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  serviceId:      z.string(),
  employeeId:     z.string(), // real ID or "any"
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:           z.string().regex(/^\d{2}:\d{2}$/),
  hairLength:     z.enum(["SHORT", "MEDIUM", "LONG"]).optional().nullable(),
  hairType:       z.enum(["STRAIGHT", "WAVY_CURLY"]).optional().nullable(),
  virginHair:     z.boolean().optional().nullable(),
  notes:          z.string().optional().nullable(),
  automationRef:  z.string().optional().nullable(), // AutomationQueue ID for conversion tracking
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
    const activeTime    = service.activeTime ?? null; // professional active minutes
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
    const staffId: string | null = data.employeeId === "any" ? null : data.employeeId;

    if (data.employeeId === "any") {
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

      const dayStart = new Date(data.date + "T00:00:00");
      const dayEnd   = new Date(data.date + "T23:59:59");

      // Load existing appointments with activeTime for all candidates in one query
      const allApts = await db.appointment.findMany({
        where: {
          salonId: salon.id,
          employeeId: { in: candidates.map((c) => c.id) },
          startsAt: { gte: dayStart, lte: dayEnd },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: {
          employeeId: true,
          startsAt: true,
          endsAt: true,
          ...aptServiceSelect,
        },
      });

      // Sort candidates by fewest appointments (load balancing)
      const countMap = new Map<string, number>();
      for (const c of candidates) countMap.set(c.id, 0);
      for (const a of allApts) countMap.set(a.employeeId, (countMap.get(a.employeeId) ?? 0) + 1);
      candidates.sort((a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0));

      const busyMap = new Map<string, typeof allApts>();
      for (const c of candidates) busyMap.set(c.id, []);
      for (const a of allApts) busyMap.get(a.employeeId)?.push(a);

      let assigned: string | null = null;
      for (const { id } of candidates) {
        const empApts = busyMap.get(id) ?? [];
        if (!empApts.some((apt) => hasConflict(apt, startsAt, endsAt))) { assigned = id; break; }
      }

      if (!assigned) {
        return NextResponse.json(
          { error: "Nenhum profissional disponível neste horário. Escolha outro." },
          { status: 409 }
        );
      }

      resolvedEmployeeId = assigned;
    } else {
      const employee = await db.employee.findFirst({
        where: { id: data.employeeId, salonId: salon.id, isActive: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
      }

      // Load existing appointments in the window for this employee
      const windowStart = new Date(startsAt); windowStart.setHours(0, 0, 0, 0);
      const windowEnd   = new Date(startsAt); windowEnd.setHours(23, 59, 59, 999);

      const existingApts = await db.appointment.findMany({
        where: {
          salonId: salon.id,
          employeeId: data.employeeId,
          startsAt: { gte: windowStart, lte: windowEnd },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        select: { startsAt: true, endsAt: true, ...aptServiceSelect },
      });

      if (existingApts.some((apt) => hasConflict(apt, startsAt, endsAt))) {
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
        staffId,
        startsAt,
        endsAt,
        totalPrice: price,
        notes:      data.notes,
        virginHair: data.virginHair ?? null,
        status:     "SCHEDULED",
        services: {
          create: {
            serviceId: data.serviceId,
            price,
            duration: durationMinutes,
            activeTime,
          },
        },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    // ─── Track automation conversion (fire-and-forget) ───────────────────────
    if (data.automationRef) {
      db.automationQueue.updateMany({
        where: {
          id:       data.automationRef,
          clientId: client.id, // safety: only update if client matches
          status:   "SENT",
          convertedAt: null,
        },
        data: { convertedAt: new Date() },
      }).catch((err) => console.error("[automation conversion]", err));
    }

    // ─── WhatsApp notification (fire-and-forget) ─────────────────────────────
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

      const virginHairLine =
        data.virginHair === true  ? `🌿 *Cabelo virgem:* Sim
` :
        data.virginHair === false ? `🌿 *Cabelo virgem:* Não (já tratado quimicamente)
` :
        "";

      const message =
        `📅 *Novo agendamento — ${salon.name}*

` +
        `👤 *Cliente:* ${appointment.client.name}
` +
        `📞 *Telefone:* ${appointment.client.phone}
` +
        `✂️ *Serviço:* ${serviceNames}
` +
        `👩‍💼 *Profissional:* ${appointment.employee.name}
` +
        `🗓️ *Data:* ${dateLabel}
` +
        `🕐 *Horário:* ${timeLabel}
` +
        virginHairLine +
        `💰 *Valor:* R$ ${appointment.totalPrice.toFixed(2).replace(".", ",")}`;

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
