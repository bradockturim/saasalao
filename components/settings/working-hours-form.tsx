"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type WorkingHourRow = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

function buildDefaultHours(): WorkingHourRow[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: "09:00",
    closeTime: "18:00",
    isOpen: i >= 1 && i <= 5,
  }));
}

interface Props {
  initialHours: WorkingHourRow[];
}

export function WorkingHoursForm({ initialHours }: Props) {
  const [hours, setHours] = useState<WorkingHourRow[]>(() => {
    const defaults = buildDefaultHours();
    return defaults.map((d) => {
      const saved = initialHours.find((h) => h.dayOfWeek === d.dayOfWeek);
      return saved ?? d;
    });
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function updateRow(dayOfWeek: number, patch: Partial<WorkingHourRow>) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h))
    );
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/working-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours: hours }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Horário de funcionamento</h2>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <div className="divide-y divide-gray-100">
          {hours.map((row) => (
            <div key={row.dayOfWeek} className="flex items-center gap-4 px-6 py-3">
              {/* Dia + toggle */}
              <div className="w-36 flex items-center gap-3 shrink-0">
                <Toggle
                  checked={row.isOpen}
                  onChange={(v) => updateRow(row.dayOfWeek, { isOpen: v })}
                />
                <span
                  className={`text-sm font-medium ${row.isOpen ? "text-gray-900" : "text-gray-400"}`}
                >
                  {DAY_NAMES[row.dayOfWeek]}
                </span>
              </div>

              {row.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={row.openTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { openTime: e.target.value })}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-400 text-sm">até</span>
                  <input
                    type="time"
                    value={row.closeTime}
                    onChange={(e) => updateRow(row.dayOfWeek, { closeTime: e.target.value })}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Fechado</span>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <Button onClick={handleSave} loading={loading} size="sm">
            Salvar horários
          </Button>
          {saved && <span className="text-sm text-green-600 font-medium">Salvo com sucesso!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
