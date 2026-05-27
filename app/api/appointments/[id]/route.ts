import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.union([
  z.object({ employeeId: z.string().min(1) }),
  z.object({
    status: z.enum([
      "SCHEDULED", "CONFIRMED", "IN_PROGRESS",
      "COMPLETED", "CANCELLED", "NO_SHOW",
    ]),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Load and validate tenant ownership
  const appointment = await db.appointment.findFirst({
    where: { id: params.id, salonId: session.user.salonId },
    include: {
      services: { select: { serviceId: true } },
    },
  });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = patchSchema.parse(body);

    // ── Employee reassignment ────────────────────────────────────────────────
    if ("employeeId" in parsed) {
      const { employeeId } = parsed;

      const employee = await db.employee.findFirst({
        where: { id: employeeId, salonId: session.user.salonId, isActive: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Profissional não encontrado ou inativo" }, { status: 404 });
      }

      const conflict = await db.appointment.findFirst({
        where: {
          id: { not: params.id },
          employeeId,
          salonId: session.user.salonId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          OR: [
            {
              startsAt: { lt: appointment.endsAt },
              endsAt:   { gt: appointment.startsAt },
            },
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `${employee.name} já tem um agendamento neste horário.` },
          { status: 409 }
        );
      }

      const updated = await db.appointment.update({
        where: { id: params.id },
        data:  { employeeId },
        include: {
          client:   { select: { id: true, name: true, phone: true } },
          employee: { select: { id: true, name: true, color: true, isActive: true } },
          services: { include: { service: { select: { name: true } } } },
        },
      });

      return NextResponse.json(updated);
    }

    // ── Status change ────────────────────────────────────────────────────────
    const updated = await db.appointment.update({
      where: { id: params.id },
      data:  { status: parsed.status },
      include: {
        client:   { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, color: true, isActive: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    // ── Automation trigger on COMPLETED ──────────────────────────────────────
    if (parsed.status === "COMPLETED") {
      const serviceIds = appointment.services.map((s) => s.serviceId);

      // Find active automation rules for the services in this appointment
      const rules = await db.automationRule.findMany({
        where: {
          salonId:   session.user.salonId,
          serviceId: { in: serviceIds },
          isActive:  true,
        },
      });

      if (rules.length > 0) {
        const completedAt = new Date();
        const queueEntries = rules.map((rule) => ({
          ruleId:        rule.id,
          clientId:      appointment.clientId,
          appointmentId: appointment.id,
          salonId:       session.user.salonId,
          scheduledAt:   new Date(
            completedAt.getTime() + rule.delayDays * 24 * 60 * 60 * 1000
          ),
        }));

        // createMany with skipDuplicates — idempotent if called twice
        await db.automationQueue.createMany({
          data:           queueEntries,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/appointments/:id]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
