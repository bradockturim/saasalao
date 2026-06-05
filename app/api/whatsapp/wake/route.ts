import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const WAHA_URL = process.env.WAHA_URL?.replace(/\/$/, "");
const WAHA_API_KEY = process.env.WAHA_API_KEY;

/** Pinga o WAHA para acordar o Railway — timeout generoso de 55s */
export async function GET() {
  const auth = await getSession();
  if (!auth || !["OWNER", "ADMIN"].includes(auth.user.role))
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!WAHA_URL) return NextResponse.json({ awake: false, error: "WAHA não configurado" });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 55000);

  try {
    const res = await fetch(`${WAHA_URL}/api/sessions`, {
      headers: { "Content-Type": "application/json", ...(WAHA_API_KEY ? { "X-Api-Key": WAHA_API_KEY } : {}) },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return NextResponse.json({ awake: res.ok, status: res.status });
  } catch (err) {
    clearTimeout(t);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({ awake: false, error: isTimeout ? "timeout" : "unreachable" });
  }
}
