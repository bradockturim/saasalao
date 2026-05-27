import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function padTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60).toString().padStart(2, "0");
  const m = (totalMins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function isBusy(
  slotStart: Date,
  slotEnd: Date,
  appointments: { startsAt: Date | string; endsAt: Date | string }[]
): boolean {
  return appointments.some((apt) => {
    const s = new Date(apt.startsAt);
    const e = new Date(apt.endsAt);
    return slotStart < e && slotEnd > s;
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { id: true },
  });
  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const serviceId  = searchParams.get("serviceId");
  const employeeId = searchParams.get("employeeId"); // real ID or "any"
  const dateStr    = searchParams.get("date");        // "YYYY-MM-DD"
  const hairLength = searchParams.get("hairLength") as "SHORT" | "MEDIUM" | "LONG" | null;

  if (!serviceId || !employeeId || !dateStr) {
    return NextResponse.json(
      { error: "serviceId, employeeId e date são obrigatórios" },
      { status: 400 }
    );
  }

  const date      = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();

  // Service + duration
  const service = await db.service.findFirst({
    where: { id: serviceId, salonId: salon.id, isActive: true },
    include: { pricings: true },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  let durationMinutes = service.duration;
  if (hairLength && service.hasPricingByLength) {
    const pricing = service.pricings.find((p) => p.hairLength === hairLength);
    if (pricing?.duration) durationMinutes = pricing.duration;
  }

  // Working hours
  const workingHour = await db.workingHour.findUnique({
    where: { salonId_dayOfWeek: { salonId: salon.id, dayOfWeek } },
  });
  if (!workingHour || !workingHour.isOpen) {
    return NextResponse.json({ slots: [], closed: true });
  }

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const openTotal  = parseTime(workingHour.openTime);
  const closeTotal = parseTime(workingHour.closeTime);
  const interval   = 30; // minutes

  const now     = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth()    &&
    date.getDate()     === now.getDate();

  // ─── "any" mode: slot available if ≥1 employee is free ───────────────────

  if (employeeId === "any") {
    // Get all active employees that can do this service
    let employees = await db.employee.findMany({
      where: {
        salonId: salon.id,
        isActive: true,
        specialties: { has: service.name },
      },
      select: { id: true },
    });

    if (employees.length === 0) {
      employees = await db.employee.findMany({
        where: {
          salonId: salon.id,
          isActive: true,
          services: { some: { serviceId } },
        },
        select: { id: true },
      });
    }

    if (employees.length === 0) {
      employees = await db.employee.findMany({
        where: { salonId: salon.id, isActive: true },
        select: { id: true },
      });
    }

    if (employees.length === 0) return NextResponse.json({ slots: [] });

    // Load all appointments for all employees on this day in ONE query
    const allApts = await db.appointment.findMany({
      where: {
        salonId: salon.id,
        employeeId: { in: employees.map((e) => e.id) },
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { employeeId: true, startsAt: true, endsAt: true },
    });

    // Build per-employee busy map
    const busyMap = new Map<string, { startsAt: Date; endsAt: Date }[]>();
    for (const emp of employees) busyMap.set(emp.id, []);
    for (const apt of allApts) {
      busyMap.get(apt.employeeId)?.push({
        startsAt: new Date(apt.startsAt),
        endsAt: new Date(apt.endsAt),
      });
    }

    const slots: string[] = [];
    for (let start = openTotal; start + durationMinutes <= closeTotal; start += interval) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(start / 60), start % 60, 0, 0);
      if (isToday && slotStart <= now) continue;

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // At least ONE employee must be free
      const anyFree = employees.some(
        (emp) => !isBusy(slotStart, slotEnd, busyMap.get(emp.id) ?? [])
      );

      if (anyFree) slots.push(padTime(start));
    }

    return NextResponse.json({ slots, durationMinutes });
  }

  // ─── Single employee mode (original logic) ────────────────────────────────

  const appointments = await db.appointment.findMany({
    where: {
      salonId: salon.id,
      employeeId,
      startsAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots: string[] = [];
  for (let start = openTotal; start + durationMinutes <= closeTotal; start += interval) {
    const slotStart = new Date(date);
    slotStart.setHours(Math.floor(start / 60), start % 60, 0, 0);
    if (isToday && slotStart <= now) continue;

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    if (!isBusy(slotStart, slotEnd, appointments)) {
      slots.push(padTime(start));
    }
  }

  return NextResponse.json({ slots, durationMinutes });
}
