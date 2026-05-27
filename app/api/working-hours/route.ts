import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const workingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isOpen: z.boolean(),
});

const schema = z.object({
  workingHours: z.array(workingHourSchema).length(7),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { workingHours } = schema.parse(body);
    const salonId = session.user.salonId;

    await db.$transaction(
      workingHours.map((wh) =>
        db.workingHour.upsert({
          where: { salonId_dayOfWeek: { salonId, dayOfWeek: wh.dayOfWeek } },
          update: { openTime: wh.openTime, closeTime: wh.closeTime, isOpen: wh.isOpen },
          create: { salonId, ...wh },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
