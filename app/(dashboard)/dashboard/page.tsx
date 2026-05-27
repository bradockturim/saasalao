import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayAppointments, type TodayAppointmentItem } from "@/components/dashboard/today-appointments";
import { AppointmentsBarChart } from "@/components/dashboard/appointments-bar-chart";
import { ServicesPieChart } from "@/components/dashboard/services-pie-chart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();
  const salonId = session.user.salonId;

  // ── Date boundaries ───────────────────────────────────────────────────────
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // ISO week: Monday → Sunday
  const dowIndex = today.getDay(); // 0=Sun … 6=Sat
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((dowIndex + 6) % 7)); // back to Monday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );

  // Last 14 days including today (day 0 = 13 days ago, day 13 = today)
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 13);

  // ── Main parallel queries ─────────────────────────────────────────────────
  const [
    appointmentsToday,
    appointmentsWeek,
    appointmentsMonth,
    todayListRaw,
    last14DaysRaw,
    cancelledMonth,
    totalMonth,
    clientsThisMonthRaw,
    monthRevenueAgg,
    monthAppointmentIdsRaw,
  ] = await Promise.all([
    // 1. Today active count
    db.appointment.count({
      where: {
        salonId,
        startsAt: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // 2. This week active count
    db.appointment.count({
      where: {
        salonId,
        startsAt: { gte: startOfWeek, lt: endOfWeek },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // 3. This month active count
    db.appointment.count({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // 4. Today upcoming list (max 8, not yet done/cancelled)
    db.appointment.findMany({
      where: {
        salonId,
        startsAt: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      },
      orderBy: { startsAt: "asc" },
      take: 8,
      include: {
        client: { select: { name: true } },
        employee: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    }),

    // 5. Last 14 days — only startsAt needed for bar chart grouping
    db.appointment.findMany({
      where: {
        salonId,
        startsAt: { gte: fourteenDaysAgo, lt: tomorrow },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { startsAt: true },
    }),

    // 6. Cancelled / no-show this month (for cancellation rate)
    db.appointment.count({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        status: { in: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // 7. Total appointments this month
    db.appointment.count({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
    }),

    // 8. Distinct clients with active appointments this month
    db.appointment.findMany({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { clientId: true },
      distinct: ["clientId"],
    }),

    // 9. Estimated revenue (all non-cancelled appointments this month)
    db.appointment.aggregate({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _sum: { totalPrice: true },
    }),

    // 10. Appointment IDs this month (used for top-services pie)
    db.appointment.findMany({
      where: {
        salonId,
        startsAt: { gte: startOfMonth, lt: startOfNextMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: { id: true },
    }),
  ]);

  // ── Dependent queries (run in parallel) ───────────────────────────────────
  const clientIdsThisMonth = clientsThisMonthRaw.map((c) => c.clientId);
  const monthApptIds = monthAppointmentIdsRaw.map((a) => a.id);

  const [returningClientsRaw, topServicesRaw] = await Promise.all([
    // Returning clients: had at least one appointment BEFORE this month
    clientIdsThisMonth.length > 0
      ? db.appointment.findMany({
          where: {
            salonId,
            startsAt: { lt: startOfMonth },
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            clientId: { in: clientIdsThisMonth },
          },
          select: { clientId: true },
          distinct: ["clientId"],
        })
      : ([] as { clientId: string }[]),

    // Top 5 services this month by count
    monthApptIds.length > 0
      ? db.appointmentService.groupBy({
          by: ["serviceId"],
          where: { appointmentId: { in: monthApptIds } },
          _count: { serviceId: true },
          orderBy: { _count: { serviceId: "desc" } },
          take: 5,
        })
      : ([] as { serviceId: string; _count: { serviceId: number } }[]),
  ]);

  // ── Service names for pie chart ───────────────────────────────────────────
  const serviceIds = topServicesRaw.map((s) => s.serviceId);
  const serviceNames =
    serviceIds.length > 0
      ? await db.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];

  // ── Derived metrics ───────────────────────────────────────────────────────
  const monthRevenue = monthRevenueAgg._sum.totalPrice ?? 0;

  const cancellationRate =
    totalMonth > 0 ? Math.round((cancelledMonth / totalMonth) * 100) : 0;

  const totalClientsThisMonth = clientIdsThisMonth.length;
  const returningCount = returningClientsRaw.length;
  const newCount = totalClientsThisMonth - returningCount;

  const newClientsPercent =
    totalClientsThisMonth > 0
      ? Math.round((newCount / totalClientsThisMonth) * 100)
      : 0;
  const recurringClientsPercent =
    totalClientsThisMonth > 0
      ? Math.round((returningCount / totalClientsThisMonth) * 100)
      : 0;

  // ── Bar chart: appointments per day for last 14 days ──────────────────────
  const barChartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayLabel = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    const count = last14DaysRaw.filter((apt) => {
      const a = new Date(apt.startsAt);
      return (
        a.getFullYear() === d.getFullYear() &&
        a.getMonth() === d.getMonth() &&
        a.getDate() === d.getDate()
      );
    }).length;
    return { day: dayLabel, agendamentos: count };
  });

  // ── Pie chart: top 5 services ─────────────────────────────────────────────
  const pieChartData = topServicesRaw.map((s) => ({
    name:
      serviceNames.find((sn) => sn.id === s.serviceId)?.name ?? "Serviço",
    value: s._count.serviceId,
  }));

  // ── Serialize dates before passing to Client Component ────────────────────
  const todayList: TodayAppointmentItem[] = todayListRaw.map((apt) => ({
    id: apt.id,
    startsAt: apt.startsAt.toISOString(),
    status: apt.status,
    client: apt.client,
    employee: apt.employee,
    services: apt.services,
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Bem-vindo ao{" "}
          <span className="font-medium text-gray-700">
            {session.user.salonName}
          </span>
        </p>
      </div>

      {/* Stats row */}
      <StatsCards
        appointmentsToday={appointmentsToday}
        appointmentsWeek={appointmentsWeek}
        appointmentsMonth={appointmentsMonth}
        monthRevenue={monthRevenue}
        cancellationRate={cancellationRate}
        newClientsPercent={newClientsPercent}
        recurringClientsPercent={recurringClientsPercent}
      />

      {/* Today's upcoming appointments */}
      <TodayAppointments appointments={todayList} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentsBarChart data={barChartData} />
        <ServicesPieChart data={pieChartData} />
      </div>
    </div>
  );
}
