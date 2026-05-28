import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Cron de lembretes — idealmente executado a cada hora (requer plano Vercel Pro).
 * No plano Hobby, configure para rodar 1x/dia cedo (ex: 06:00 UTC).
 *
 * Envia:
 *   - Lembrete 24h antes: appointments que começam entre 23h e 25h a partir de agora
 *   - Lembrete  2h antes: appointments que começam entre 1h50 e 2h10 a partir de agora
 *
 * Protegido por Authorization: Bearer <CRON_SECRET>.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  const now = new Date();

  // Windows de busca (±10min de margem)
  const w24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const w24End   = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const w2Start  = new Date(now.getTime() +  1 * 60 * 60 * 1000 + 50 * 60 * 1000);
  const w2End    = new Date(now.getTime() +  2 * 60 * 60 * 1000 + 10 * 60 * 1000);

  // Busca appointments nos dois janelas que ainda não têm lembrete enviado
  const [apts24, apts2] = await Promise.all([
    db.appointment.findMany({
      where: {
        startsAt:  { gte: w24Start, lte: w24End },
        status:    { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
        reminders: { none: { type: "HOURS_24" } },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        salon:    { select: { name: true, slug: true } },
      },
      take: 200,
    }),
    db.appointment.findMany({
      where: {
        startsAt:  { gte: w2Start, lte: w2End },
        status:    { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
        reminders: { none: { type: "HOURS_2" } },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        salon:    { select: { name: true, slug: true } },
      },
      take: 200,
    }),
  ]);

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  let sent = 0;
  let failed = 0;

  function fmtTime(d: Date) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  }
  function fmtDate(d: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo",
    }).format(d);
  }

  // ── 24h reminders ──────────────────────────────────────────────────────────
  for (const apt of apts24) {
    const svcNames = apt.services.map((s) => s.service.name).join(", ");
    const myAptsLink = `${baseUrl}/book/${apt.salon.slug}/minha-conta`;

    const message =
      `Olá, ${apt.client.name}! 👋\n\n` +
      `Lembrando que você tem um horário *amanhã* em *${apt.salon.name}*:\n\n` +
      `✂️ *Serviço:* ${svcNames}\n` +
      `👩‍💼 *Profissional:* ${apt.employee.name}\n` +
      `🗓️ *Data:* ${fmtDate(apt.startsAt)}\n` +
      `🕐 *Horário:* ${fmtTime(apt.startsAt)}\n\n` +
      `Nos vemos lá! 🌸\n` +
      `_Precisa cancelar? Acesse: ${myAptsLink}_`;

    const result = await sendWhatsAppMessage(apt.client.phone, message);

    await db.appointmentReminder.create({
      data: {
        appointmentId: apt.id,
        salonId:       apt.salonId,
        type:          "HOURS_24",
      },
    }).catch(() => {}); // ignore duplicate inserts on race conditions

    if (result.ok) sent++; else failed++;
  }

  // ── 2h reminders ───────────────────────────────────────────────────────────
  for (const apt of apts2) {
    const svcNames = apt.services.map((s) => s.service.name).join(", ");

    const message =
      `Olá, ${apt.client.name}! 👋\n\n` +
      `Seu horário em *${apt.salon.name}* é em *2 horas*!\n\n` +
      `✂️ *Serviço:* ${svcNames}\n` +
      `👩‍💼 *Profissional:* ${apt.employee.name}\n` +
      `🕐 *Às:* ${fmtTime(apt.startsAt)}\n\n` +
      `Aguardamos você! 😊`;

    const result = await sendWhatsAppMessage(apt.client.phone, message);

    await db.appointmentReminder.create({
      data: {
        appointmentId: apt.id,
        salonId:       apt.salonId,
        type:          "HOURS_2",
      },
    }).catch(() => {});

    if (result.ok) sent++; else failed++;
  }

  console.log(`[cron/reminders] 24h: ${apts24.length}, 2h: ${apts2.length} | sent: ${sent}, failed: ${failed}`);
  return NextResponse.json({
    reminders24h: apts24.length,
    reminders2h:  apts2.length,
    sent,
    failed,
  });
}

export const GET = POST;
