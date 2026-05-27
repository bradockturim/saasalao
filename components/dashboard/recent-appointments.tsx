import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

type Appointment = {
  id: string;
  startsAt: Date;
  totalPrice: number;
  status: string;
  client: { name: string };
  employee: { name: string };
  services: { service: { name: string } }[];
};

export function RecentAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Agendamentos recentes</h2>
      </CardHeader>
      <CardContent className="p-0">
        {appointments.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            Nenhum agendamento ainda.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{apt.client.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {apt.services.map((s) => s.service.name).join(", ")} · {apt.employee.name}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(apt.startsAt)} {formatTime(apt.startsAt)}
                    </p>
                    <p className="text-sm text-gray-500">{formatCurrency(apt.totalPrice)}</p>
                  </div>
                  <AppointmentStatusBadge status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
