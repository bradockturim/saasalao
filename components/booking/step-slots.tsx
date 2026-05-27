"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  salonSlug: string;
  serviceId: string;
  employeeId: string;
  date: string;
  hairLength: "SHORT" | "MEDIUM" | "LONG";
  selected: string | null;
  onSelect: (time: string) => void;
}

export function StepSlots({
  salonSlug,
  serviceId,
  employeeId,
  date,
  hairLength,
  selected,
  onSelect,
}: Props) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!serviceId || !employeeId || !date) return;

    setLoading(true);
    setSlots([]);
    setClosed(false);

    fetch(
      `/api/public/${salonSlug}/slots?serviceId=${serviceId}&employeeId=${employeeId}&date=${date}&hairLength=${hairLength}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.closed) { setClosed(true); return; }
        setSlots(data.slots ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [salonSlug, serviceId, employeeId, date, hairLength]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (closed) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        O salão não funciona neste dia.
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        Nenhum horário disponível nesta data. Tente outro dia ou profissional.
      </div>
    );
  }

  // Group slots by morning / afternoon / evening
  const morning   = slots.filter((s) => parseInt(s) < 12);
  const afternoon = slots.filter((s) => parseInt(s) >= 12 && parseInt(s) < 18);
  const evening   = slots.filter((s) => parseInt(s) >= 18);

  const groups = [
    { label: "Manhã", slots: morning },
    { label: "Tarde", slots: afternoon },
    { label: "Noite", slots: evening },
  ].filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {group.label}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {group.slots.map((slot) => {
              const isSel = slot === selected;
              return (
                <button
                  key={slot}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "rounded-xl py-2 text-sm font-semibold transition-all",
                    isSel
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
