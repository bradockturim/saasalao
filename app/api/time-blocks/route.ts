import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  employeeId: z.string().nullable().optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/),
  endTime:    z.string().regex(/^\d{2}:\d{2}$/),
  reason:     z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

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
    gte = new Date(today); gte.setDate(today.getDate() - day); gte.setHours(0, 0, 0, 0);
    lte = new Date(gte);   lte.setDate(gte.getDate() + 6);     lte.setHours(23, 59, 59, 999);
  }

  const blocks = await db.timeBlock.findMany({
    where: {
      salonId:  session.user.salonId,
      startsAt: { gte, lte },
    },
    include: { employee: { select: { id: true, name: true, color: true } } },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);

    const startsAt = new Date(data.date + "T00:00:00");
    startsAt.setHours(sh, sm, 0, 0);
    const endsAt = new Date(data.date + "T00:00:00");
    endsAt.setHours(eh, em, 0, 0);

    if (endsAt <= startsAt) {
      return NextResponse.json({ error: "Horário de fim deve ser após o início" }, { status: 400 });
    }

    const block = await db.timeBlock.create({
      data: {
        salonId:    session.user.salonId,
        employeeId: data.employeeId || null,
        startsAt,
        endsAt,
        reason:     data.reason || null,
      },
      include: { employee: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
