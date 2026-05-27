import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { formatPhoneForWhatsApp, sendWhatsAppMessage } from "@/lib/whatsapp";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8, "Número muito curto"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  if (session.user.salonId !== params.id)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  try {
    const body = await req.json();
    const { phone } = schema.parse(body);

    // Valida que o número tem ao menos 10 dígitos após limpeza
    const formatted = formatPhoneForWhatsApp(phone);
    if (formatted.replace(/\D/g, "").length < 12) {
      return NextResponse.json(
        { error: "Número de WhatsApp inválido. Verifique o DDD e o número." },
        { status: 400 }
      );
    }

    const message =
      `✅ *Conexão confirmada!*\n\n` +
      `Olá! Esta é uma mensagem de teste do *SaaSAlão*.\n` +
      `Seu WhatsApp está configurado corretamente para receber notificações de agendamentos. 💅`;

    const result = await sendWhatsAppMessage(phone, message);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, sentTo: formatted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[POST whatsapp/test]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
