import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { WeeklyCalendar } from "@/components/appointments/weekly-calendar";

export const metadata: Metadata = { title: "Agendamentos" };

export default async function AppointmentsPage() {
  const session = await requireAuth();
  const salonId = session.user.salonId;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [appointments, employees] = await Promise.all([
    db.appointment.findMany({
      where: { salonId, startsAt: { gte: weekStart, lte: weekEnd } },
      include: {
        client:   { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true, color: true, isActive: true } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { startsAt: "asc" },
    }),
    db.employee.findMany({
      where:   { salonId, isActive: true },
      select:  { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <p className="text-gray-600">Visualize e gerencie a agenda semanal</p>
      </div>
      <WeeklyCalendar initialAppointments={appointments} employees={employees} />
    </div>
  );
}
