import {
  Calendar,
  CalendarDays,
  CalendarRange,
  DollarSign,
  XCircle,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  appointmentsToday: number;
  appointmentsWeek: number;
  appointmentsMonth: number;
  monthRevenue: number;
  cancellationRate: number;
  newClientsPercent: number;
  recurringClientsPercent: number;
}

export function StatsCards({
  appointmentsToday,
  appointmentsWeek,
  appointmentsMonth,
  monthRevenue,
  cancellationRate,
  newClientsPercent,
  recurringClientsPercent,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Agendamentos hoje",
      value: appointmentsToday.toString(),
      icon: Calendar,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Agendamentos esta semana",
      value: appointmentsWeek.toString(),
      icon: CalendarDays,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Agendamentos este mês",
      value: appointmentsMonth.toString(),
      icon: CalendarRange,
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      label: "Receita estimada do mês",
      value: formatCurrency(monthRevenue),
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Taxa de cancelamento",
      value: `${cancellationRate}%`,
      icon: XCircle,
      color:
        cancellationRate > 20
          ? "text-red-600 bg-red-50"
          : "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <div className={`p-2.5 rounded-xl shrink-0 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 truncate">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* New vs Recurring card */}
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="p-2.5 rounded-xl shrink-0 text-purple-600 bg-purple-50">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 leading-tight">Clientes</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-green-600">{newClientsPercent}%</span>
                <span className="text-xs text-gray-400">novos</span>
                <span className="text-gray-300 mx-0.5">·</span>
                <span className="text-base font-bold text-blue-600">
                  {recurringClientsPercent}%
                </span>
                <span className="text-xs text-gray-400">rec.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
