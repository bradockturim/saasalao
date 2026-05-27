import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { StaffForm } from "@/components/staff/staff-form";

export const metadata: Metadata = { title: "Novo Profissional" };

export default async function NovoProfissionalPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const services = await db.service.findMany({
    where: { salonId: session.user.salonId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link
          href="/dashboard/profissionais"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo profissional</h1>
        <p className="text-gray-600">Cadastre um novo membro da equipe</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <StaffForm services={services} />
      </div>
    </div>
  );
}
