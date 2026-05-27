import { Calendar, Users, Scissors, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  todayAppointments: number;
  totalClients: number;
  totalServices: number;
  todayRevenue: number;
}

export function StatsCards({
  todayAppointments,
  totalClients,
  totalServices,
  todayRevenue,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Agendamentos hoje",
      value: todayAppointments.toString(),
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Receita hoje",
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Total de clientes",
      value: totalClients.toString(),
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Serviços ativos",
      value: totalServices.toString(),
      icon: Scissors,
      color: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
