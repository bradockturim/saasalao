import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const WAHA_URL = process.env.WAHA_URL?.replace(/\/$/, "");
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SESSION = process.env.WAHA_SESSION ?? "default";

function wahaHeaders() {
  return {
    "Content-Type": "application/json",
    ...(WAHA_API_KEY ? { "X-Api-Key": WAHA_API_KEY } : {}),
  };
}

async function wfetch(url: string, options: RequestInit = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(t);
    return r;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function getStatus(): Promise<{ status: string; httpStatus: number }> {
  const res = await wfetch(`${WAHA_URL}/api/sessions/${SESSION}`, { headers: wahaHeaders() });
  if (!res.ok) return { status: "UNKNOWN", httpStatus: res.status };
  const data = await res.json();
  return { status: data?.status ?? "UNKNOWN", httpStatus: res.status };
}

export async function GET() {
  const auth = await getSession();
  if (!auth || !["OWNER", "ADMIN"].includes(auth.user.role))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!WAHA_URL)
    return NextResponse.json({ configured: false });

  try {
    let { status, httpStatus } = await getStatus();

    if (httpStatus === 401) {
      return NextResponse.json({
        configured: true, status: "ERROR", qr: null,
        error: "API key incorreta. WAHA_API_KEY no Vercel deve ser igual a WHATSAPP_API_KEY no Railway.",
      });
    }

    // Sessão não existe → cria e inicia
    if (httpStatus === 404) {
      await wfetch(`${WAHA_URL}/api/sessions`, {
        method: "POST",
        headers: wahaHeaders(),
        body: JSON.stringify({ name: SESSION }),
      }, 10000).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
      const s = await getStatus();
      status = s.status;
    }

    // Sessão parada → inicia e re-verifica
    if (status === "STOPPED") {
      await wfetch(`${WAHA_URL}/api/sessions/${SESSION}/start`, {
        method: "POST",
        headers: wahaHeaders(),
      }, 10000).catch(() => {});
      await new Promise((r) => setTimeout(r, 3000));
      const s = await getStatus();
      status = s.status;
    }

    // Busca QR se ainda não conectado
    let qr: string | null = null;
    if (status !== "WORKING") {
      const qrRes = await wfetch(
        `${WAHA_URL}/api/${SESSION}/auth/qr`,
        { headers: { ...wahaHeaders(), Accept: "application/json" } },
        8000
      ).catch(() => null);

      if (qrRes?.ok) {
        try {
          const d = await qrRes.json();
          qr = d?.value ?? null;
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ configured: true, status, qr });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      configured: true, status: "ERROR", qr: null,
      error: isTimeout
        ? "WAHA não respondeu. O Railway pode estar dormindo — aguarde 30s e tente novamente."
        : err instanceof Error ? err.message : "Erro de rede",
    });
  }
}
