"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Appointment = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  totalPrice: number;
  client: { id: string; name: string; phone: string };
  employee: { id: string; name: string; color: string };
  services: { service: { name: string } }[];
};

interface Props {
  appointments: Appointment[];
  employees: { id: string; name: string; color: string }[];
  services: { id: string; name: string; duration: number; price: number }[];
}

export function AppointmentsCalendar({ appointments }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();

  const days: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ];

  function getAppointmentsForDay(day: number) {
    return appointments.filter((apt) => {
      const d = new Date(apt.startsAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const selectedDay = currentDate.getDate();
  const selectedApts = getAppointmentsForDay(selectedDay);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={i} />;
              const hasApts = getAppointmentsForDay(day).length > 0;
              const isSelected = day === selectedDay;
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <button
                  key={i}
                  onClick={() => setCurrentDate(new Date(year, month, day))}
                  className={`
                    relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${isSelected ? "bg-primary-600 text-white" : "hover:bg-gray-100"}
                    ${isToday && !isSelected ? "font-bold text-primary-600" : ""}
                  `}
                >
                  {day}
                  {hasApts && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Agendamentos — {selectedDay} de {monthNames[month]}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {selectedApts.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">
              Nenhum agendamento para este dia.
            </p>
          ) : (
            selectedApts.map((apt) => (
              <div key={apt.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="w-1 self-stretch rounded-full mt-1"
                    style={{ backgroundColor: apt.employee.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{apt.client.name}</p>
                    <p className="text-sm text-gray-500">
                      {apt.services.map((s) => s.service.name).join(", ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(apt.startsAt)} – {formatTime(apt.endsAt)} · {apt.employee.name}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-medium text-gray-900">{formatCurrency(apt.totalPrice)}</p>
                  <AppointmentStatusBadge status={apt.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
