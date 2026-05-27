import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * Daily cron job — scheduled via vercel.json at 13:00 UTC (10:00 BRT).
 *
 * Finds all AutomationQueue items with status=PENDING and scheduledAt <= now,
 * renders the message template, sends via WhatsApp, and marks them SENT (or FAILED).
 *
 * Protected by Authorization: Bearer <CRON_SECRET> header.
 */
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  const now = new Date();

  // ── Fetch pending items ─────────────────────────────────────────────────────
  const pending = await db.automationQueue.findMany({
    where: {
      status:      "PENDING",
      scheduledAt: { lte: now },
    },
    include: {
      client:  { select: { name: true, phone: true } },
      rule: {
        include: {
          service: { select: { name: true } },
          salon:   { select: { slug: true, name: true } },
        },
      },
    },
    take: 200, // safety limit per run
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  let sent   = 0;
  let failed = 0;

  // ── Process each item ───────────────────────────────────────────────────────
  for (const item of pending) {
    const { client, rule } = item;
    const bookingLink = `${baseUrl}/book/${rule.salon.slug}?serviceId=${rule.serviceId}&ref=${item.id}`;

    const message = rule.messageTemplate
      .replaceAll("{nome}",    client.name)
      .replaceAll("{servico}", rule.service.name)
      .replaceAll("{link}",    bookingLink);

    const result = await sendWhatsAppMessage(client.phone, message);

    if (result.ok) {
      await db.automationQueue.update({
        where: { id: item.id },
        data:  { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } else {
      await db.automationQueue.update({
        where: { id: item.id },
        data:  { status: "FAILED" },
      });
      console.error(`[cron/automation] Failed for queue ${item.id}:`, result.error);
      failed++;
    }
  }

  console.log(`[cron/automation] Done — sent: ${sent}, failed: ${failed}`);
  return NextResponse.json({ processed: pending.length, sent, failed });
}

// Allow Vercel cron (GET is also called by some Vercel cron setups)
export const GET = POST;
