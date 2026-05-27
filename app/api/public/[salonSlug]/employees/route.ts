import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  const serviceId = searchParams.get("serviceId");

  const select = {
    id: true,
    name: true,
    color: true,
    role: true,
    avatarUrl: true,
    specialties: true,
  };

  if (!serviceId) {
    const employees = await db.employee.findMany({
      where: { salonId: salon.id, isActive: true },
      select,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(employees);
  }

  // 1️⃣ Get service info (need name for specialties filter)
  const service = await db.service.findFirst({
    where: { id: serviceId, salonId: salon.id, isActive: true },
    select: { name: true },
  });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  // 2️⃣ Try: filter by specialties (service name inside the array)
  const bySpecialties = await db.employee.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      specialties: { has: service.name },
    },
    select,
    orderBy: { name: "asc" },
  });
  if (bySpecialties.length > 0) return NextResponse.json(bySpecialties);

  // 3️⃣ Fallback: filter by EmployeeService junction table
  const byJunction = await db.employee.findMany({
    where: {
      salonId: salon.id,
      isActive: true,
      services: { some: { serviceId } },
    },
    select,
    orderBy: { name: "asc" },
  });
  if (byJunction.length > 0) return NextResponse.json(byJunction);

  // 4️⃣ Final fallback: all active employees
  const all = await db.employee.findMany({
    where: { salonId: salon.id, isActive: true },
    select,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(all);
}
