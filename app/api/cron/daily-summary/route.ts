import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Cron de resumo diário — roda às 20h (horário de Brasília = 23h UTC).
 * Envia para cada salão com whatsappDailySummary=true a lista de
 * agendamentos do dia seguinte.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  // Amanhã em horário de Brasília (UTC-3, sem horário de verão desde 2019)
  // Usa en-CA para obter YYYY-MM-DD no timezone correto
  const now = new Date();
  const todayBRT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  // 00:00 BRT = 03:00 UTC — avança para amanhã
  const dayStart = new Date(todayBRT + "T03:00:00Z");
  dayStart.setUTCDate(dayStart.getUTCDate() + 1);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const salons = await db.salon.findMany({
    where: { isActive: true, whatsappDailySummary: true, whatsappNumber: { not: null } },
    select: { id: true, name: true, whatsappNumber: true },
  });

  let sent = 0;
  let failed = 0;

  for (const salon of salons) {
    if (!salon.whatsappNumber) continue;

    const appointments = await db.appointment.findMany({
      where: {
        salonId: salon.id,
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startsAt: "asc" },
    });

    const dateLabel = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "2-digit", month: "long",
      timeZone: "America/Sao_Paulo",
    }).format(dayStart);

    if (appointments.length === 0) {
      const message =
        `📅 *Agenda de amanhã — ${salon.name}*\n\n` +
        `_${dateLabel}_\n\n` +
        `Nenhum agendamento para amanhã. Aproveite para descansar! 🌸`;

      const result = await sendWhatsAppMessage(salon.whatsappNumber, message);
      if (result.ok) sent++; else failed++;
      continue;
    }

    const lines = appointments.map((apt, i) => {
      const time = new Date(apt.startsAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
      });
      const svc = apt.services.map((s) => s.service.name).join(", ");
      return `${i + 1}. *${time}* — ${apt.client.name} (${svc}) com ${apt.employee.name}`;
    });

    const message =
      `📅 *Agenda de amanhã — ${salon.name}*\n\n` +
      `_${dateLabel}_\n\n` +
      lines.join("\n") +
      `\n\n` +
      `Total: *${appointments.length} agendamento${appointments.length > 1 ? "s" : ""}* 💅`;

    const result = await sendWhatsAppMessage(salon.whatsappNumber, message);
    if (result.ok) sent++; else failed++;
  }

  return NextResponse.json({ salons: salons.length, sent, failed });
}

export const GET = POST;
