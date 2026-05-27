import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentAppointments } from "@/components/dashboard/recent-appointments";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();
  const salonId = session.user.salonId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayAppointments, totalClients, totalServices, recentAppointments] =
    await Promise.all([
      db.appointment.count({
        where: { salonId, startsAt: { gte: today, lt: tomorrow } },
      }),
      db.client.count({ where: { salonId, isActive: true } }),
      db.service.count({ where: { salonId, isActive: true } }),
      db.appointment.findMany({
        where: { salonId },
        orderBy: { startsAt: "desc" },
        take: 5,
        include: {
          client: { select: { name: true } },
          employee: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
      }),
    ]);

  const todayRevenue = await db.appointment.aggregate({
    where: {
      salonId,
      startsAt: { gte: today, lt: tomorrow },
      status: "COMPLETED",
    },
    _sum: { totalPrice: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao {session.user.salonName}</p>
      </div>

      <StatsCards
        todayAppointments={todayAppointments}
        totalClients={totalClients}
        totalServices={totalServices}
        todayRevenue={todayRevenue._sum.totalPrice ?? 0}
      />

      <RecentAppointments appointments={recentAppointments} />
    </div>
  );
}
