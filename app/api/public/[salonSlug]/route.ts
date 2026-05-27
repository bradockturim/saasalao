import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      logoUrl: true,
      workingHours: {
        orderBy: { dayOfWeek: "asc" },
        select: { dayOfWeek: true, openTime: true, closeTime: true, isOpen: true },
      },
    },
  });

  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  const services = await db.service.findMany({
    where: { salonId: salon.id, isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      hasPricingByLength: true,
      category: { select: { id: true, name: true, color: true } },
      pricings: { select: { hairLength: true, price: true, duration: true } },
    },
  });

  return NextResponse.json({ salon, services });
}
