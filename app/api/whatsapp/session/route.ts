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

export async function GET() {
  const auth = await getSession();
  if (!auth || !["OWNER", "ADMIN"].includes(auth.user.role))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!WAHA_URL)
    return NextResponse.json({ configured: false }, { status: 200 });

  try {
    // Tenta buscar status da sessão
    let res = await fetch(`${WAHA_URL}/api/sessions/${SESSION}`, {
      headers: wahaHeaders(),
    });

    // Sessão não existe — cria
    if (res.status === 404) {
      await fetch(`${WAHA_URL}/api/sessions`, {
        method: "POST",
        headers: wahaHeaders(),
        body: JSON.stringify({ name: SESSION }),
      });
      await new Promise((r) => setTimeout(r, 1500));
      res = await fetch(`${WAHA_URL}/api/sessions/${SESSION}`, {
        headers: wahaHeaders(),
      });
    }

    const sessionData = res.ok ? await res.json() : {};
    const status: string = sessionData?.status ?? "UNKNOWN";

    // Sessão parada — inicia
    if (status === "STOPPED") {
      await fetch(`${WAHA_URL}/api/sessions/${SESSION}/start`, {
        method: "POST",
        headers: wahaHeaders(),
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Se não estiver conectado, busca QR code
    let qr: string | null = null;
    if (status !== "WORKING") {
      const qrRes = await fetch(`${WAHA_URL}/api/${SESSION}/auth/qr`, {
        headers: { ...wahaHeaders(), Accept: "application/json" },
      });
      if (qrRes.ok) {
        try {
          const qrData = await qrRes.json();
          qr = qrData?.value ?? null;
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ configured: true, status, qr });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro de rede";
    return NextResponse.json({ configured: true, status: "ERROR", qr: null, error: msg });
  }
}
