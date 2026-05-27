import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  delayDays:       z.number().int().min(1).max(365).optional(),
  messageTemplate: z.string().min(10).optional(),
  isActive:        z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const rule = await db.automationRule.findFirst({
    where: { id: params.id, salonId: session.user.salonId },
  });
  if (!rule) return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const updated = await db.automationRule.update({
      where: { id: params.id },
      data,
      include: {
        service: {
          select: {
            id: true, name: true,
            category: { select: { name: true, color: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/automations/:id]", error);
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

  const rule = await db.automationRule.findFirst({
    where: { id: params.id, salonId: session.user.salonId },
  });
  if (!rule) return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });

  await db.automationRule.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
