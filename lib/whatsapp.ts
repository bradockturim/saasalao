// ─── Phone formatting ─────────────────────────────────────────────────────────

/**
 * Prepara um número de telefone brasileiro para uso na API do WhatsApp.
 *
 * Exemplos:
 *   "(21) 99999-9999"  → "5521999999999"
 *   "021999999999"     → "5521999999999"
 *   "21999999999"      → "5521999999999"
 *   "5521999999999"    → "5521999999999"  (já formatado)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // 1. Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, "");

  // 2. Se começar com 0, remove (DDDs nunca começam com 0 no Brasil)
  if (digits.startsWith("0")) digits = digits.slice(1);

  // 3. Se não começa com 55 (código BR), adiciona
  if (!digits.startsWith("55")) digits = "55" + digits;

  return digits;
}

// ─── Input mask ───────────────────────────────────────────────────────────────

/**
 * Aplica a máscara (XX) XXXXX-XXXX a uma string de entrada.
 * Limita a 11 dígitos (2 DDD + 9 número).
 */
export function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ─── Send message (Z-API) ─────────────────────────────────────────────────────

interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia uma mensagem de texto via Z-API.
 *
 * Requer variáveis de ambiente:
 *   ZAPI_INSTANCE_ID  — ID da instância no Z-API
 *   ZAPI_TOKEN        — Token da instância
 *   ZAPI_SECURITY_TOKEN — (opcional) Client-Token de segurança
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<SendResult> {
  const instanceId     = process.env.ZAPI_INSTANCE_ID;
  const token          = process.env.ZAPI_TOKEN;
  const securityToken  = process.env.ZAPI_SECURITY_TOKEN;

  if (!instanceId || !token) {
    return {
      ok: false,
      error:
        "WhatsApp não configurado. Adicione ZAPI_INSTANCE_ID e ZAPI_TOKEN " +
        "nas variáveis de ambiente do servidor.",
    };
  }

  const phone = formatPhoneForWhatsApp(to);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (securityToken) headers["Client-Token"] = securityToken;

    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ phone, message }),
      }
    );

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        errMsg = body?.message ?? body?.error ?? errMsg;
      } catch { /* ignore */ }
      return { ok: false, error: errMsg };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro de rede";
    return { ok: false, error: msg };
  }
}
