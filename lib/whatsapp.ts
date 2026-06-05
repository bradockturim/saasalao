// ─── Phone formatting ─────────────────────────────────────────────────────────

export function formatPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("55")) digits = "55" + digits;
  return digits;
}

// ─── Input mask ───────────────────────────────────────────────────────────────

export function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Send message (WAHA) ──────────────────────────────────────────────────────

interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia uma mensagem de texto via WAHA (WhatsApp HTTP API).
 *
 * Variáveis de ambiente necessárias:
 *   WAHA_URL      — URL pública da instância WAHA (ex: https://xxx.railway.app)
 *   WAHA_API_KEY  — Chave definida na variável WHATSAPP_API_KEY do WAHA
 *   WAHA_SESSION  — Nome da sessão (padrão: "default")
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<SendResult> {
  const wahaUrl    = process.env.WAHA_URL;
  const apiKey     = process.env.WAHA_API_KEY;
  const session    = (process.env.WAHA_SESSION ?? "default").trim();

  if (!wahaUrl || !apiKey) {
    return {
      ok: false,
      error:
        "WhatsApp não configurado. Adicione WAHA_URL e WAHA_API_KEY " +
        "nas variáveis de ambiente do servidor.",
    };
  }

  const phone  = formatPhoneForWhatsApp(to);
  const chatId = `${phone}@c.us`;

  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
  };

  async function trySend(url: string, body: object): Promise<SendResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const raw = await res.text();
          try {
            const data = JSON.parse(raw);
            errMsg = data?.message ?? data?.error ?? data?.details ?? data?.detail ?? raw.slice(0, 200);
          } catch {
            errMsg = raw.slice(0, 200) || errMsg;
          }
        } catch { /* ignore */ }
        return { ok: false, error: errMsg };
      }

      return { ok: true };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError")
        return { ok: false, error: "Timeout: WAHA não respondeu em 25 segundos" };
      return { ok: false, error: err instanceof Error ? err.message : "Erro de rede" };
    }
  }

  // Tenta endpoint novo (WAHA v2+), com fallback para legado
  const result = await trySend(`${wahaUrl}/api/${session}/sendText`, { chatId, text: message });
  const shouldFallback = !result.ok && (
    result.error?.includes("404") ||
    result.error?.includes("Cannot POST") ||
    result.error?.includes("Timeout") ||
    result.error?.includes("not found")
  );
  if (shouldFallback) {
    return trySend(`${wahaUrl}/api/sendText`, { session, chatId, text: message });
  }
  return result;
}
