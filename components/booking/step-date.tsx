"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type WorkingHour = { dayOfWeek: number; isOpen: boolean };

interface Props {
  selected: string | null; // "YYYY-MM-DD"
  onSelect: (date: string) => void;
  workingHours: WorkingHour[];
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function StepDate({ selected, onSelect, workingHours }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const openDays = new Set(
    workingHours.filter((h) => h.isOpen).map((h) => h.dayOfWeek)
  );

  function isDisabled(day: number) {
    const d = new Date(year, month, day);
    if (d < today) return true;
    if (!openDays.has(d.getDay())) return true;
    return false;
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={year === today.getFullYear() && month <= today.getMonth()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_SHORT.map((d, i) => (
          <div key={i} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const ymd      = toYMD(new Date(year, month, day));
          const disabled = isDisabled(day);
          const isToday  = ymd === toYMD(today);
          const isSel    = ymd === selected;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => !disabled && onSelect(ymd)}
              className={cn(
                "aspect-square flex items-center justify-center text-sm rounded-xl transition-all font-medium",
                disabled && "text-gray-300 cursor-not-allowed",
                !disabled && !isSel && "hover:bg-primary-50 hover:text-primary-700 text-gray-700",
                isToday && !isSel && "font-bold text-primary-600",
                isSel && "bg-primary-600 text-white shadow-sm"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="text-center text-sm text-primary-700 font-medium pt-1">
          {new Intl.DateTimeFormat("pt-BR", {
            weekday: "long", day: "numeric", month: "long",
          }).format(new Date(selected + "T12:00:00"))}
        </p>
      )}
    </div>
  );
}
