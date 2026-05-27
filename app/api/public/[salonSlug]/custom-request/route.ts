import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const schema = z.object({
  serviceName:  z.string().min(2).max(200),
  notes:        z.string().max(500).optional().nullable(),
  timeSlot1:    z.string().min(2).max(100),
  timeSlot2:    z.string().max(100).optional().nullable(),
  timeSlot3:    z.string().max(100).optional().nullable(),
  clientName:   z.string().min(2),
  clientPhone:  z.string().min(8),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { salonSlug: string } }
) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { id: true, name: true, whatsappNumber: true, phone: true },
  });
  if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const notifyTo = salon.whatsappNumber || salon.phone;

    // Build the WhatsApp message regardless — return ok even without WhatsApp
    if (notifyTo) {
      const slots = [data.timeSlot1, data.timeSlot2, data.timeSlot3]
        .filter(Boolean)
        .map((s, i) => `   ${i + 1}. ${s}`)
        .join("\n");

      const message =
        `📋 *Pedido de Agendamento — ${salon.name}*\n\n` +
        `👤 *Cliente:* ${data.clientName}\n` +
        `📞 *WhatsApp:* ${data.clientPhone}\n` +
        `✂️ *Serviço:* ${data.serviceName}\n` +
        (data.notes ? `📝 *Obs:* ${data.notes}\n` : "") +
        `\n🕐 *Horários preferidos:*\n${slots}\n\n` +
        `_Responda este WhatsApp para confirmar o agendamento._`;

      sendWhatsAppMessage(notifyTo, message).catch((err) =>
        console.error("[custom-request WhatsApp]", err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[custom-request]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
