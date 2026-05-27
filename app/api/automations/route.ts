import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  serviceId:       z.string().min(1),
  delayDays:       z.number().int().min(1).max(365),
  messageTemplate: z.string().min(10),
  isActive:        z.boolean().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const salonId = session.user.salonId;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [rules, sentStats, convStats] = await Promise.all([
    db.automationRule.findMany({
      where:   { salonId },
      include: {
        service: {
          select: {
            id: true, name: true,
            category: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    // Messages sent this month, grouped by rule
    db.automationQueue.groupBy({
      by:    ["ruleId"],
      where: { salonId, status: "SENT", sentAt: { gte: start, lt: end } },
      _count: { ruleId: true },
    }),

    // Conversions this month, grouped by rule
    db.automationQueue.groupBy({
      by:    ["ruleId"],
      where: { salonId, convertedAt: { gte: start, lt: end } },
      _count: { ruleId: true },
    }),
  ]);

  const sentMap  = Object.fromEntries(sentStats.map( (s) => [s.ruleId, s._count.ruleId]));
  const convMap  = Object.fromEntries(convStats.map( (s) => [s.ruleId, s._count.ruleId]));

  const data = rules.map((r) => ({
    ...r,
    stats: {
      sentThisMonth:      sentMap[r.id]  ?? 0,
      convertedThisMonth: convMap[r.id]  ?? 0,
    },
  }));

  return NextResponse.json(data);
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

    // Validate service belongs to salon
    const service = await db.service.findFirst({
      where: { id: data.serviceId, salonId: session.user.salonId },
    });
    if (!service) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    }

    const rule = await db.automationRule.create({
      data: {
        salonId:         session.user.salonId,
        serviceId:       data.serviceId,
        delayDays:       data.delayDays,
        messageTemplate: data.messageTemplate,
        isActive:        data.isActive,
      },
      include: {
        service: {
          select: {
            id: true, name: true,
            category: { select: { name: true, color: true } },
          },
        },
      },
    });

    return NextResponse.json({ ...rule, stats: { sentThisMonth: 0, convertedThisMonth: 0 } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/automations]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
