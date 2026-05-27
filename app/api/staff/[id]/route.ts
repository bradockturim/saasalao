import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const updateStaffSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").optional(),
  photoUrl: z.string().url().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

async function getStaffOwnedBySalon(id: string, salonId: string) {
  return db.employee.findFirst({ where: { id, salonId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const staff = await getStaffOwnedBySalon(params.id, session.user.salonId);
  if (!staff) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(staff);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const existing = await getStaffOwnedBySalon(params.id, session.user.salonId);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateStaffSchema.parse(body);

    const updated = await db.employee.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.photoUrl !== undefined && { avatarUrl: data.photoUrl }),
        ...(data.specialties !== undefined && { specialties: data.specialties }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[PUT /api/staff/:id]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const existing = await getStaffOwnedBySalon(params.id, session.user.salonId);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Verifica se há agendamentos futuros
  const futureAppointments = await db.appointment.count({
    where: { employeeId: params.id, startsAt: { gte: new Date() } },
  });

  if (futureAppointments > 0) {
    return NextResponse.json(
      { error: `Este profissional tem ${futureAppointments} agendamento(s) futuro(s). Desative-o em vez de excluir.` },
      { status: 409 }
    );
  }

  await db.employee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
