import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const pricingSchema = z.object({
  hairLength: z.enum(["SHORT", "MEDIUM", "LONG"]),
  price: z.number().min(0),
  duration: z.number().int().min(1).optional().nullable(),
});

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  duration: z.number().int().min(1),
  price: z.number().min(0),
  hasPricingByLength: z.boolean().default(false),
  activeTime: z.number().int().min(1).optional().nullable(),
  requiresVirginHairCheck: z.boolean().default(false),
  pricings: z.array(pricingSchema).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const services = await db.service.findMany({
    where: { salonId: session.user.salonId },
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true, color: true } },
      pricings: true,
    },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createServiceSchema.parse(body);

    const service = await db.service.create({
      data: {
        salonId: session.user.salonId,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        duration: data.duration,
        price: data.price,
        hasPricingByLength: data.hasPricingByLength,
        activeTime: data.activeTime ?? null,
        requiresVirginHairCheck: data.requiresVirginHairCheck,
        pricings: data.hasPricingByLength && data.pricings?.length
          ? {
              create: data.pricings.map((p) => ({
                salonId: session.user.salonId,
                hairLength: p.hairLength,
                price: p.price,
                duration: p.duration,
              })),
            }
          : undefined,
      },
      include: { category: true, pricings: true },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/services]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
