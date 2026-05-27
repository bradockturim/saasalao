import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { StaffForm } from "@/components/staff/staff-form";

export const metadata: Metadata = { title: "Editar Profissional" };

interface Props {
  params: { id: string };
}

export default async function EditarProfissionalPage({ params }: Props) {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const salonId = session.user.salonId;

  const [member, services, futureAppointments] = await Promise.all([
    db.employee.findFirst({
      where: { id: params.id, salonId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        specialties: true,
        isActive: true,
      },
    }),
    db.service.findMany({
      where: { salonId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.appointment.findMany({
      where: {
        employeeId: params.id,
        salonId,
        startsAt: { gte: new Date() },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: {
        client: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    }),
  ]);

  if (!member) notFound();

  const hasInactiveAlert = !member.isActive && futureAppointments.length > 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Editar profissional</h1>
        <p className="text-gray-600">{member.name}</p>
      </div>

      {/* Alerta: profissional inativo com agendamentos futuros */}
      {hasInactiveAlert && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-amber-800">
              Profissional inativo com {futureAppointments.length} agendamento(s) futuro(s)
            </p>
            <ul className="text-xs text-amber-700 space-y-1">
              {futureAppointments.map((apt) => (
                <li key={apt.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(apt.startsAt))}{" "}
                    · {apt.client.name} —{" "}
                    {apt.services.map((s) => s.service.name).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600">
              Considere reagendar ou cancelar esses agendamentos antes de desativar.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <StaffForm
          initialData={{
            id: member.id,
            name: member.name,
            avatarUrl: member.avatarUrl,
            specialties: member.specialties,
            isActive: member.isActive,
          }}
          services={services}
        />
      </div>
    </div>
  );
}
