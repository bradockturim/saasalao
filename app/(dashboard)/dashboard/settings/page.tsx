import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const salon = await db.salon.findUnique({
    where: { id: session.user.salonId },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      whatsappNumber: true,
      whatsappNotifyNew: true,
      workingHours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!salon) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do seu salão</p>
      </div>
      <SettingsForm salon={salon} />
    </div>
  );
}
