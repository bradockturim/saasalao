"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Calendar,
  AlertTriangle, ChevronDown, RefreshCw,
} from "lucide-react";
import { AppointmentStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  startsAt: string | Date;
  endsAt: string | Date;
  status: string;
  totalPrice: number;
  client: { id: string; name: string; phone: string };
  employee: { id: string; name: string; color: string; isActive: boolean };
  services: { service: { name: string } }[];
};

type EmployeeFilter = {
  id: string;
  name: string;
  color: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_START = 7;
const HOUR_END   = 21;
const SLOT_MIN   = 30;
const SLOT_PX    = 56;

const TOTAL_SLOTS  = ((HOUR_END - HOUR_START) * 60) / SLOT_MIN;
const GRID_HEIGHT  = TOTAL_SLOTS * SLOT_PX;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function topPx(date: Date): number {
  const mins = date.getHours() * 60 + date.getMinutes() - HOUR_START * 60;
  return Math.max(0, (mins / SLOT_MIN) * SLOT_PX);
}

function heightPx(start: Date, end: Date): number {
  const dur = (end.getTime() - start.getTime()) / 60000;
  return Math.max(SLOT_PX / 2, (dur / SLOT_MIN) * SLOT_PX);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function formatWeekRange(start: Date): string {
  const end  = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const s = new Intl.DateTimeFormat("pt-BR", opts).format(start);
  const e = new Intl.DateTimeFormat("pt-BR", { ...opts, year: "numeric" }).format(end);
  return `${s} – ${e}`;
}

// ─── Appointment card ─────────────────────────────────────────────────────────

function AppCard({
  apt,
  onClick,
}: {
  apt: Appointment;
  onClick: (a: Appointment) => void;
}) {
  const start  = new Date(apt.startsAt);
  const end    = new Date(apt.endsAt);
  const top    = topPx(start);
  const height = heightPx(start, end);
  const short  = height < 48;

  return (
    <button
      onClick={() => onClick(apt)}
      className={cn(
        "absolute inset-x-1 rounded-lg px-2 py-1 text-left text-white overflow-hidden",
        "shadow-sm hover:brightness-90 transition-all focus:outline-none focus:ring-2 focus:ring-white/60",
        !apt.employee.isActive && "ring-2 ring-amber-400 ring-inset"
      )}
      style={{
        top,
        height,
        backgroundColor: apt.employee.color,
        minHeight: 24,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-tight truncate">{apt.client.name}</p>
        {!apt.employee.isActive && (
          <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0 mt-px" />
        )}
      </div>
      {!short && (
        <>
          <p className="text-[10px] opacity-80 leading-tight truncate mt-0.5">
            {apt.services.map((s) => s.service.name).join(", ")}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <div
              className="w-2 h-2 rounded-full shrink-0 border border-white/40"
              style={{ backgroundColor: apt.employee.color }}
            />
            <p className="text-[10px] opacity-80 truncate">{apt.employee.name}</p>
          </div>
        </>
      )}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function AppDetail({
  apt,
  employees,
  onClose,
  onReassigned,
}: {
  apt: Appointment;
  employees: EmployeeFilter[];
  onClose: () => void;
  onReassigned: (updated: Appointment) => void;
}) {
  const [reassigning, setReassigning] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(apt.employee.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReassign() {
    if (selectedEmpId === apt.employee.id) { setReassigning(false); return; }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/appointments/${apt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selectedEmpId }),
    });

    setLoading(false);

    if (res.ok) {
      const updated = await res.json();
      onReassigned(updated);
      setReassigning(false);
    } else {
      const json = await res.json();
      setError(json.error ?? "Erro ao reatribuir");
    }
  }

  return (
    <div
      className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{apt.client.name}</h3>
            <p className="text-sm text-gray-500">{apt.client.phone}</p>
          </div>
          <AppointmentStatusBadge status={apt.status} />
        </div>

        {/* Info */}
        <div className="text-sm space-y-1.5 text-gray-700">
          <p>
            <span className="text-gray-500">Horário: </span>
            {formatTime(new Date(apt.startsAt))} – {formatTime(new Date(apt.endsAt))}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-gray-500">Profissional: </span>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: apt.employee.color }}
            />
            {apt.employee.name}
            {!apt.employee.isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-2.5 h-2.5" />
                inativo
              </span>
            )}
          </p>
          <p>
            <span className="text-gray-500">Serviço(s): </span>
            {apt.services.map((s) => s.service.name).join(", ")}
          </p>
          <p>
            <span className="text-gray-500">Total: </span>
            <span className="font-medium text-gray-900">{formatCurrency(apt.totalPrice)}</span>
          </p>
        </div>

        {/* Reatribuir */}
        {!reassigning ? (
          <button
            onClick={() => setReassigning(true)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
          >
            <RefreshCw className="w-4 h-4" />
            Reatribuir profissional
          </button>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Escolha o profissional
            </p>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                  {emp.id === apt.employee.id ? " (atual)" : ""}
                </option>
              ))}
            </select>

            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReassign}
                loading={loading}
                disabled={selectedEmpId === apt.employee.id}
                className="flex-1"
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setReassigning(false); setError(null); }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <Button variant="secondary" size="sm" onClick={onClose} className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
}

// ─── Employee filter dropdown ─────────────────────────────────────────────────

function EmployeeFilterDropdown({
  employees,
  value,
  onChange,
}: {
  employees: EmployeeFilter[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = employees.find((e) => e.id === value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 transition-colors"
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selected.color }}
            />
            <span className="font-medium text-gray-900 max-w-[120px] truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-600">Todos os profissionais</span>
        )}
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px] py-1 overflow-hidden">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left",
              !value && "bg-primary-50 text-primary-700 font-medium"
            )}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
            Todos os profissionais
          </button>

          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => { onChange(emp.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left",
                value === emp.id && "bg-primary-50 text-primary-700 font-medium"
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: emp.color }}
              />
              {emp.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialAppointments: Appointment[];
  employees: EmployeeFilter[];
}

export function WeeklyCalendar({ initialAppointments, employees }: Props) {
  const today = new Date();
  const [weekStart,      setWeekStart]      = useState(() => getWeekStart(today));
  const [appointments,   setAppointments]   = useState<Appointment[]>(initialAppointments);
  const [filterEmployee, setFilterEmployee] = useState<string>("");  // "" = all
  const [loading,        setLoading]        = useState(false);
  const [selected,       setSelected]       = useState<Appointment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 8:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = ((8 - HOUR_START) * 60 / SLOT_MIN) * SLOT_PX - 8;
      scrollRef.current.scrollTop = offset;
    }
  }, []);

  const fetchWeek = useCallback(async (start: Date, empId?: string) => {
    setLoading(true);
    try {
      const iso     = start.toISOString().split("T")[0];
      const empParam = (empId ?? filterEmployee) ? `&employeeId=${empId ?? filterEmployee}` : "";
      const res     = await fetch(`/api/appointments?weekStart=${iso}${empParam}`);
      if (res.ok) setAppointments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterEmployee]);

  function navigate(dir: -1 | 1) {
    const next = addDays(weekStart, dir * 7);
    setWeekStart(next);
    fetchWeek(next);
  }

  function goToday() {
    const start = getWeekStart(today);
    setWeekStart(start);
    fetchWeek(start);
  }

  function handleFilterChange(empId: string) {
    setFilterEmployee(empId);
    fetchWeek(weekStart, empId);
  }

  function handleReassigned(updated: Appointment) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelected(updated);
  }

  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const total = HOUR_START * 60 + i * SLOT_MIN;
    const h = Math.floor(total / 60).toString().padStart(2, "0");
    const m = (total % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  });

  function getApts(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.startsAt), day));
  }

  const isCurrentWeek = isSameDay(weekStart, getWeekStart(today));
  const nowTop = isCurrentWeek ? topPx(today) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant={isCurrentWeek ? "primary" : "ghost"}
            size="sm"
            onClick={goToday}
            className="gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            Hoje
          </Button>
          <span className="text-sm font-medium text-gray-700 ml-1">
            {formatWeekRange(weekStart)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Employee filter */}
          {employees.length > 0 && (
            <EmployeeFilterDropdown
              employees={employees}
              value={filterEmployee}
              onChange={handleFilterChange}
            />
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Carregando…
            </div>
          )}
        </div>
      </div>

      {/* Day header row */}
      <div className="grid shrink-0 border-b border-gray-200" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-gray-100" />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={cn(
                "py-2 text-center border-r border-gray-100 last:border-r-0",
                isToday && "bg-primary-50"
              )}
            >
              <p className="text-xs text-gray-500">{DAY_SHORT[day.getDay()]}</p>
              <p className={cn("text-sm font-semibold mt-0.5", isToday ? "text-primary-700" : "text-gray-800")}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-y-auto flex-1" style={{ maxHeight: 560 }}>
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: GRID_HEIGHT }}>
          {/* Time labels */}
          <div className="relative border-r border-gray-100">
            {timeSlots.map((t, i) => (
              <div
                key={t}
                className="absolute right-2 text-[10px] text-gray-400 -translate-y-1/2"
                style={{ top: i * SLOT_PX }}
              >
                {t.endsWith(":00") ? t : ""}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const dayApts = getApts(day);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={di}
                className={cn(
                  "relative border-r border-gray-100 last:border-r-0",
                  isToday && "bg-primary-50/30"
                )}
                style={{ height: GRID_HEIGHT }}
              >
                {timeSlots.map((_, si) => (
                  <div
                    key={si}
                    className={cn("absolute inset-x-0 border-t", si % 2 === 0 ? "border-gray-100" : "border-gray-50")}
                    style={{ top: si * SLOT_PX }}
                  />
                ))}

                {isToday && nowTop !== null && (
                  <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                    <div className="flex-1 h-px bg-red-400" />
                  </div>
                )}

                {dayApts.map((apt) => (
                  <AppCard key={apt.id} apt={apt} onClick={setSelected} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail overlay */}
      {selected && (
        <AppDetail
          apt={selected}
          employees={employees}
          onClose={() => setSelected(null)}
          onReassigned={handleReassigned}
        />
      )}
    </div>
  );
}
