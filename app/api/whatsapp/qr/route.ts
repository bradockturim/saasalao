import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const WAHA_URL = process.env.WAHA_URL?.replace(/\/$/, "");
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const SESSION = (process.env.WAHA_SESSION ?? "default").trim();

export async function GET() {
  const auth = await getSession();
  if (!auth || !["OWNER", "ADMIN"].includes(auth.user.role))
    return new NextResponse("Não autorizado", { status: 401 });

  if (!WAHA_URL)
    return new NextResponse("WAHA não configurado", { status: 500 });

  try {
    const res = await fetch(`${WAHA_URL}/api/${SESSION}/auth/qr`, {
      headers: {
        ...(WAHA_API_KEY ? { "X-Api-Key": WAHA_API_KEY } : {}),
      },
    });

    if (!res.ok) {
      return new NextResponse("QR indisponível", { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";

    // WAHA retornou imagem diretamente
    if (contentType.includes("image/")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    // WAHA retornou JSON com campo value (data URL) ou base64
    const data = await res.json();
    const value: string | null = data?.value ?? data?.qr ?? null;

    if (!value) return new NextResponse("QR indisponível", { status: 404 });

    // Se já é data URL, extrai o base64
    const base64 = value.startsWith("data:")
      ? value.split(",")[1]
      : value;

    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new NextResponse("Erro ao buscar QR", { status: 502 });
  }
}
