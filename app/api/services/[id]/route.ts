import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const pricingSchema = z.object({
  hairLength: z.enum(["SHORT", "MEDIUM", "LONG"]),
  price: z.number().min(0),
  duration: z.number().int().min(1).optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  duration: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  hasPricingByLength: z.boolean().optional(),
  isActive: z.boolean().optional(),
  pricings: z.array(pricingSchema).optional(),
});

async function assertOwnership(salonId: string, serviceId: string) {
  const service = await db.service.findFirst({
    where: { id: serviceId, salonId },
  });
  return service;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const existing = await assertOwnership(session.user.salonId, params.id);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const { pricings, ...serviceData } = data;

    const service = await db.$transaction(async (tx) => {
      if (pricings !== undefined) {
        await tx.servicePricing.deleteMany({ where: { serviceId: params.id } });

        if (data.hasPricingByLength && pricings.length > 0) {
          await tx.servicePricing.createMany({
            data: pricings.map((p) => ({
              serviceId: params.id,
              salonId: session.user.salonId,
              hairLength: p.hairLength,
              price: p.price,
              duration: p.duration ?? null,
            })),
          });
        }
      }

      return tx.service.update({
        where: { id: params.id },
        data: serviceData,
        include: { category: true, pricings: true },
      });
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const existing = await assertOwnership(session.user.salonId, params.id);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await db.service.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return new NextResponse(null, { status: 204 });
}
