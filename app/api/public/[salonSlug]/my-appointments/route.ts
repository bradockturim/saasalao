import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { id: true, cancellationHours: true },
  });
  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  const rawPhone = new URL(req.url).searchParams.get("phone") ?? "";
  const phone    = rawPhone.replace(/\D/g, "");
  if (phone.length < 8) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }

  const client = await db.client.findFirst({
    where: { salonId: salon.id, phone },
    select: { id: true, name: true },
  });
  if (!client) {
    // Return empty lists — not an error (client may not exist yet)
    return NextResponse.json({ upcoming: [], past: [], cancellationHours: salon.cancellationHours });
  }

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.appointment.findMany({
      where: {
        salonId:  salon.id,
        clientId: client.id,
        startsAt: { gte: now },
        status:   { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      orderBy: { startsAt: "asc" },
      take:    20,
      include: {
        employee: { select: { name: true } },
        services: {
          include: { service: { select: { id: true, name: true } } },
        },
      },
    }),

    db.appointment.findMany({
      where: {
        salonId:  salon.id,
        clientId: client.id,
        startsAt: { lt: now },
      },
      orderBy: { startsAt: "desc" },
      take:    20,
      include: {
        employee: { select: { name: true } },
        services: {
          include: { service: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  // Serialize dates for client
  const serialize = (apt: typeof upcoming[0]) => ({
    id:         apt.id,
    startsAt:   apt.startsAt.toISOString(),
    endsAt:     apt.endsAt.toISOString(),
    status:     apt.status,
    totalPrice: apt.totalPrice,
    employee:   apt.employee,
    services:   apt.services.map((s) => ({
      serviceId:   s.serviceId,
      serviceName: s.service.name,
    })),
  });

  return NextResponse.json({
    clientName:        client.name,
    cancellationHours: salon.cancellationHours,
    upcoming:          upcoming.map(serialize),
    past:              past.map(serialize),
  });
}
