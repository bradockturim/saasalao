import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { ClientsTable } from "@/components/clients/clients-table";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const session = await requireAuth();

  const clients = await db.client.findMany({
    where: { salonId: session.user.salonId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { appointments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">{clients.length} clientes cadastrados</p>
        </div>
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}
