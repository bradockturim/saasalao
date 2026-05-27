"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";

export type TodayAppointmentItem = {
  id: string;
  startsAt: string; // ISO string
  status: string;
  client: { name: string };
  employee: { name: string };
  services: { service: { name: string } }[];
};

export function TodayAppointments({
  appointments: initial,
}: {
  appointments: TodayAppointmentItem[];
}) {
  const [list, setList] = useState(initial);
  const [completing, setCompleting] = useState<string | null>(null);

  async function handleComplete(id: string) {
    setCompleting(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((apt) =>
            apt.id === id ? { ...apt, status: "COMPLETED" } : apt
          )
        );
      }
    } catch {
      // silently ignore network errors
    } finally {
      setCompleting(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Próximos atendimentos hoje
          </h2>
        </div>
        <span className="text-sm text-gray-500">
          {list.filter((a) => a.status !== "COMPLETED").length} pendente
          {list.filter((a) => a.status !== "COMPLETED").length !== 1 ? "s" : ""}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {list.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            Nenhum atendimento agendado para hoje.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((apt) => {
              const isDone = apt.status === "COMPLETED";
              return (
                <div
                  key={apt.id}
                  className={`flex items-center justify-between px-6 py-3 transition-colors ${
                    isDone ? "bg-gray-50 opacity-60" : "hover:bg-gray-50/50"
                  }`}
                >
                  {/* Time */}
                  <div className="w-14 shrink-0">
                    <span className="text-sm font-semibold text-primary-600">
                      {formatTime(apt.startsAt)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 mx-3">
                    <p
                      className={`font-medium text-gray-900 truncate ${
                        isDone ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {apt.client.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {apt.services.map((s) => s.service.name).join(", ")}
                      <span className="text-gray-400"> · </span>
                      {apt.employee.name}
                    </p>
                  </div>

                  {/* Status / Action */}
                  {isDone ? (
                    <Badge variant="success" className="shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Concluído
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={completing === apt.id}
                      onClick={() => handleComplete(apt.id)}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Concluir
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
