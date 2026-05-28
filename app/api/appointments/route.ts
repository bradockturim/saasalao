import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

// ─── Shared conflict helper ───────────────────────────────────────────────────

type AptConflict = { startsAt: Date; endsAt: Date; services: { activeTime: number | null }[] };

function profEndsAt(apt: AptConflict): Date {
  const times = apt.services.map((s) => s.activeTime).filter((t): t is number => t != null);
  if (times.length === 0) return apt.endsAt;
  const end = new Date(apt.startsAt);
  end.setMinutes(end.getMinutes() + Math.max(...times));
  return end;
}

// ─── GET — list appointments ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart  = searchParams.get("weekStart");
  const employeeId = searchParams.get("employeeId");

  let gte: Date;
  let lte: Date;

  if (weekStart) {
    gte = new Date(weekStart + "T00:00:00");
    lte = new Date(gte);
    lte.setDate(lte.getDate() + 6);
    lte.setHours(23, 59, 59, 999);
  } else {
    const today = new Date();
    const day   = today.getDay();
    gte = new Date(today);
    gte.setDate(today.getDate() - day);
    gte.setHours(0, 0, 0, 0);
    lte = new Date(gte);
    lte.setDate(lte.getDate() + 6);
    lte.setHours(23, 59, 59, 999);
  }

  const appointments = await db.appointment.findMany({
    where: {
      salonId:    session.user.salonId,
      startsAt:   { gte, lte },
      ...(employeeId ? { employeeId } : {}),
    },
    include: {
      client:   { select: { id: true, name: true, phone: true } },
      employee: { select: { id: true, name: true, color: true, isActive: true } },
      services: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(appointments);
}

// ─── POST — admin create appointment ─────────────────────────────────────────

const createSchema = z.object({
  // Client: existing or new
  clientId:  z.string().optional(),
  newClient: z.object({
    name:  z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().nullable(),
  }).optional(),
  serviceId:  z.string(),
  employeeId: z.string(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:       z.string().regex(/^\d{2}:\d{2}$/),
  hairLength: z.enum(["SHORT", "MEDIUM", "LONG"]).optional().nullable(),
  notes:      z.string().optional().nullable(),
}).refine((d) => d.clientId || d.newClient, {
  message: "Informe o cliente ou preencha os dados para criar um novo",
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // ── Service ──────────────────────────────────────────────────────────────
    const service = await db.service.findFirst({
      where: { id: data.serviceId, salonId: session.user.salonId, isActive: true },
      include: { pricings: true },
    });
    if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

    let price           = service.price;
    let durationMinutes = service.duration;
    const activeTime    = service.activeTime ?? null;

    if (data.hairLength && service.hasPricingByLength) {
      const pricing = service.pricings.find((p) => p.hairLength === data.hairLength);
      if (pricing) {
        price = pricing.price;
        if (pricing.duration) durationMinutes = pricing.duration;
      }
    }

    // ── Build time range ─────────────────────────────────────────────────────
    const [h, m] = data.time.split(":").map(Number);
    const startsAt = new Date(`${data.date}T00:00:00`);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);

    // ── Employee ──────────────────────────────────────────────────────────────
    const employee = await db.employee.findFirst({
      where: { id: data.employeeId, salonId: session.user.salonId, isActive: true },
    });
    if (!employee) return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });

    // ── Conflict check (respects activeTime) ─────────────────────────────────
    const dayStart = new Date(data.date + "T00:00:00");
    const dayEnd   = new Date(data.date + "T23:59:59");

    const existing = await db.appointment.findMany({
      where: {
        salonId:    session.user.salonId,
        employeeId: data.employeeId,
        startsAt:   { gte: dayStart, lte: dayEnd },
        status:     { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { startsAt: true, endsAt: true, services: { select: { activeTime: true } } },
    });

    const hasConflict = existing.some((apt) => {
      const e = profEndsAt(apt as AptConflict);
      return startsAt < e && endsAt > apt.startsAt;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: `${employee.name} já tem um agendamento neste horário.` },
        { status: 409 }
      );
    }

    // ── Upsert client ─────────────────────────────────────────────────────────
    let clientId: string;

    if (data.clientId) {
      const existing = await db.client.findFirst({
        where: { id: data.clientId, salonId: session.user.salonId },
      });
      if (!existing) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      clientId = existing.id;
    } else {
      const nc = data.newClient!;
      const phone = nc.phone.replace(/\D/g, "");
      const client = await db.client.upsert({
        where: { salonId_phone: { salonId: session.user.salonId, phone } },
        update: { name: nc.name, email: nc.email },
        create: { salonId: session.user.salonId, name: nc.name, phone, email: nc.email },
      });
      clientId = client.id;
    }

    // ── Create appointment ────────────────────────────────────────────────────
    const appointment = await db.appointment.create({
      data: {
        salonId:    session.user.salonId,
        clientId,
        employeeId: data.employeeId,
        startsAt,
        endsAt,
        totalPrice: price,
        notes:      data.notes,
        status:     "SCHEDULED",
        services: {
          create: { serviceId: data.serviceId, price, duration: durationMinutes, activeTime },
        },
      },
      include: {
        client:   { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, color: true, isActive: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/appointments]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
