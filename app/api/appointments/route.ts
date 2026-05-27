import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart  = searchParams.get("weekStart");
  const employeeId = searchParams.get("employeeId"); // optional filter

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
