import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createStaffSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  photoUrl: z.string().url().optional().nullable(),
  specialties: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const staff = await db.employee.findMany({
    where: { salonId: session.user.salonId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      specialties: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          appointments: {
            where: { startsAt: { gte: new Date() } },
          },
        },
      },
    },
  });

  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createStaffSchema.parse(body);

    const staff = await db.employee.create({
      data: {
        salonId: session.user.salonId,
        name: data.name,
        avatarUrl: data.photoUrl,
        specialties: data.specialties,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/staff]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
