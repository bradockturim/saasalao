import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name:    z.string().min(2).optional(),
  email:   z.string().email().optional(),
  phone:   z.string().optional(),
  address: z.string().optional(),
  city:    z.string().optional(),
  state:   z.string().max(2).optional(),
  // WhatsApp
  whatsappNumber:    z.string().optional().nullable(),
  whatsappNotifyNew: z.boolean().optional(),
  // Client self-service
  cancellationHours: z.number().int().min(1).max(72).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (session.user.salonId !== params.id)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const salon = await db.salon.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(salon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
