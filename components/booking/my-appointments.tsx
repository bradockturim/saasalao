"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone, Calendar, Clock, CheckCircle2,
  XCircle, RotateCcw, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AptService = { serviceId: string; serviceName: string };

type Appointment = {
  id:         string;
  startsAt:   string;
  endsAt:     string;
  status:     string;
  totalPrice: number;
  employee:   { name: string };
  services:   AptService[];
};

type Data = {
  clientName:        string;
  cancellationHours: number;
  upcoming:          Appointment[];
  past:              Appointment[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: "success" | "info" | "warning" | "default" | "danger" }> = {
  SCHEDULED:   { label: "Agendado",       variant: "info"    },
  CONFIRMED:   { label: "Confirmado",     variant: "success" },
  IN_PROGRESS: { label: "Em andamento",   variant: "warning" },
  COMPLETED:   { label: "Concluído",      variant: "success" },
  CANCELLED:   { label: "Cancelado",      variant: "danger"  },
  NO_SHOW:     { label: "Não compareceu", variant: "danger"  },
};

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
  }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function canCancel(apt: Appointment, cancellationHours: number) {
  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status)) return false;
  const hoursLeft = (new Date(apt.startsAt).getTime() - Date.now()) / 3_600_000;
  return hoursLeft >= cancellationHours;
}

// ─── Appointment card ─────────────────────────────────────────────────────────

function AptCard({
  apt,
  salonSlug,
  cancellationHours,
  onCancel,
  cancelling,
}: {
  apt:               Appointment;
  salonSlug:         string;
  cancellationHours: number;
  onCancel:          (id: string) => void;
  cancelling:        string | null;
}) {
  const firstServiceId = apt.services[0]?.serviceId;
  const serviceNames   = apt.services.map((s) => s.serviceName).join(", ");
  const status         = STATUS_MAP[apt.status] ?? { label: apt.status, variant: "default" as const };
  const allowCancel    = canCancel(apt, cancellationHours);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{serviceNames}</p>
          <p className="text-sm text-gray-500 mt-0.5">{apt.employee.name}</p>
        </div>
        <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {fmtDate(apt.startsAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {fmtTime(apt.startsAt)}
        </span>
        <span className="ml-auto font-semibold text-gray-700">
          {formatCurrency(apt.totalPrice)}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        {firstServiceId && (
          <Link
            href={`/book/${salonSlug}/book?serviceId=${firstServiceId}`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200
              px-3 py-2 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700
              hover:bg-primary-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reagendar
          </Link>
        )}

        {allowCancel && (
          <button
            onClick={() => onCancel(apt.id)}
            disabled={cancelling === apt.id}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200
              px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling === apt.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MyAppointments({ salonSlug }: { salonSlug: string }) {
  const [phone, setPhone]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [data, setData]           = useState<Data | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Digite um telefone válido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/${salonSlug}/my-appointments?phone=${encodeURIComponent(phone)}`
      );
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erro ao buscar."); return; }
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!confirm("Confirmar cancelamento deste agendamento?")) return;
    setCancelError("");
    setCancelling(appointmentId);
    try {
      const res = await fetch(
        `/api/public/${salonSlug}/my-appointments/cancel`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ appointmentId, clientPhone: phone }),
        }
      );
      const json = await res.json();
      if (!res.ok) { setCancelError(json.error ?? "Erro ao cancelar."); return; }

      // Update local state: mark as cancelled
      setData((prev) =>
        prev
          ? {
              ...prev,
              upcoming: prev.upcoming.map((a) =>
                a.id === appointmentId ? { ...a, status: "CANCELLED" } : a
              ),
            }
          : prev
      );
    } finally {
      setCancelling(null);
    }
  }

  // ── Phone entry phase ──────────────────────────────────────────────────────

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Meus Agendamentos</h2>
            <p className="text-sm text-gray-500">
              Digite seu WhatsApp para ver seus horários.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-center
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                placeholder:text-gray-400"
            />
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Buscar agendamentos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Appointments phase ─────────────────────────────────────────────────────

  const hasUpcoming = data.upcoming.length > 0;
  const hasPast     = data.past.length > 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Greeting + change phone */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-gray-900">Olá, {data.clientName}! 👋</p>
          <p className="text-sm text-gray-500">{phone}</p>
        </div>
        <button
          onClick={() => { setData(null); setPhone(""); }}
          className="text-xs text-primary-600 hover:underline font-medium"
        >
          Trocar número
        </button>
      </div>

      {cancelError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {cancelError}
        </div>
      )}

      {/* Upcoming */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Próximos atendimentos
        </h3>
        {hasUpcoming ? (
          data.upcoming.map((apt) => (
            <AptCard
              key={apt.id}
              apt={apt}
              salonSlug={salonSlug}
              cancellationHours={data.cancellationHours}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 py-10 text-center text-sm text-gray-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Nenhum agendamento futuro.</p>
            <Link
              href={`/book/${salonSlug}`}
              className="inline-block mt-2 text-primary-600 font-medium hover:underline text-sm"
            >
              Agendar agora →
            </Link>
          </div>
        )}
      </section>

      {/* Past */}
      {hasPast && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Histórico
          </h3>
          {data.past.map((apt) => (
            <AptCard
              key={apt.id}
              apt={apt}
              salonSlug={salonSlug}
              cancellationHours={data.cancellationHours}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </section>
      )}

      {!hasUpcoming && !hasPast && (
        <div className="text-center text-sm text-gray-400 py-8">
          Nenhum histórico encontrado para este número.
        </div>
      )}
    </div>
  );
}
