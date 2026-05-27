import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { ServicesList } from "@/components/services/services-list";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicesPage() {
  const session = await requireAuth();
  const salonId = session.user.salonId;

  const [services, categories] = await Promise.all([
    db.service.findMany({
      where: { salonId },
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true, color: true } },
        pricings: true,
      },
    }),
    db.serviceCategory.findMany({
      where: { salonId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <p className="text-gray-600">Gerencie os serviços oferecidos pelo salão</p>
      </div>
      <ServicesList initialServices={services} categories={categories} />
    </div>
  );
}
