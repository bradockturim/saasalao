import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const clients = await db.client.findMany({
    where: {
      salonId: session.user.salonId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name:  { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json(clients);
}
