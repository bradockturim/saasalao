import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const block = await db.timeBlock.findFirst({
    where: { id: params.id, salonId: session.user.salonId },
  });
  if (!block) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await db.timeBlock.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
