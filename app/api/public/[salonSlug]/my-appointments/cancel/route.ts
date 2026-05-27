import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  appointmentId: z.string().min(1),
  clientPhone:   z.string().min(8),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { id: true, cancellationHours: true },
  });
  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  try {
    const body  = await req.json();
    const data  = schema.parse(body);
    const phone = data.clientPhone.replace(/\D/g, "");

    const appointment = await db.appointment.findFirst({
      where: { id: data.appointmentId, salonId: salon.id },
      include: { client: { select: { phone: true } } },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    // Validate phone matches
    const storedPhone = appointment.client.phone.replace(/\D/g, "");
    if (!storedPhone.endsWith(phone) && !phone.endsWith(storedPhone)) {
      return NextResponse.json({ error: "Telefone não confere" }, { status: 403 });
    }

    // Check status
    if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status)) {
      return NextResponse.json({ error: "Agendamento não pode ser cancelado" }, { status: 409 });
    }

    // Check cancellation window
    const msUntil   = appointment.startsAt.getTime() - Date.now();
    const hoursLeft = msUntil / (1000 * 60 * 60);
    if (hoursLeft < salon.cancellationHours) {
      return NextResponse.json(
        {
          error: `Cancelamento só é permitido com pelo menos ${salon.cancellationHours}h de antecedência.`,
        },
        { status: 409 }
      );
    }

    await db.appointment.update({
      where: { id: appointment.id },
      data:  { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[my-appointments/cancel]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
