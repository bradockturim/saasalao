"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Search, UserPlus } from "lucide-react";

type HairLength = "SHORT" | "MEDIUM" | "LONG";

type Client   = { id: string; name: string; phone: string; email?: string | null };
type Service  = { id: string; name: string; duration: number; price: number; hasPricingByLength: boolean; pricings: { hairLength: HairLength; price: number; duration: number | null }[] };
type Employee = { id: string; name: string; color: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (apt: unknown) => void;
  employees: Employee[];
}

const HAIR_LABELS: Record<HairLength, string> = { SHORT: "Curto", MEDIUM: "Médio", LONG: "Longo" };

export function AppointmentCreateModal({ open, onClose, onCreated, employees }: Props) {
  const [services, setServices]     = useState<Service[]>([]);
  const [clients, setClients]       = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);

  const [form, setForm] = useState({
    clientId:   "",
    newName:    "",
    newPhone:   "",
    serviceId:  "",
    employeeId: "",
    date:       "",
    time:       "",
    hairLength: "" as HairLength | "",
    notes:      "",
  });

  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load services on open
  useEffect(() => {
    if (!open) return;
    setForm({ clientId:"", newName:"", newPhone:"", serviceId:"", employeeId:"", date:"", time:"", hairLength:"", notes:"" });
    setClientSearch("");
    setShowNewClient(false);
    setClients([]);
    setError("");
    setResolvedPrice(null);
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
  }, [open]);

  // Search clients with debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!clientSearch.trim()) { setClients([]); return; }
    searchTimeout.current = setTimeout(() => {
      fetch(`/api/clients?q=${encodeURIComponent(clientSearch)}`)
        .then((r) => r.json()).then(setClients).catch(() => {});
    }, 300);
  }, [clientSearch]);

  // Resolve price when service/hairLength changes
  useEffect(() => {
    const svc = services.find((s) => s.id === form.serviceId);
    if (!svc) { setResolvedPrice(null); return; }
    if (svc.hasPricingByLength && form.hairLength) {
      const p = svc.pricings.find((x) => x.hairLength === form.hairLength);
      setResolvedPrice(p?.price ?? svc.price);
    } else {
      setResolvedPrice(svc.price);
    }
  }, [form.serviceId, form.hairLength, services]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.clientId && !showNewClient) { setError("Selecione ou cadastre um cliente."); return; }
    if (showNewClient && (!form.newName.trim() || !form.newPhone.trim())) {
      setError("Nome e telefone do novo cliente são obrigatórios."); return;
    }
    if (!form.serviceId) { setError("Selecione um serviço."); return; }
    if (!form.employeeId) { setError("Selecione um profissional."); return; }
    if (!form.date)       { setError("Informe a data."); return; }
    if (!form.time)       { setError("Informe o horário."); return; }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        serviceId:  form.serviceId,
        employeeId: form.employeeId,
        date:       form.date,
        time:       form.time,
        hairLength: form.hairLength || null,
        notes:      form.notes || null,
      };

      if (showNewClient) {
        body.newClient = { name: form.newName.trim(), phone: form.newPhone.trim() };
      } else {
        body.clientId = form.clientId;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar agendamento."); return; }

      onCreated(data);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const selectedService = services.find((s) => s.id === form.serviceId);

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Cliente ─────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Cliente *</label>
            <button
              type="button"
              onClick={() => { setShowNewClient((v) => !v); set("clientId", ""); setClientSearch(""); }}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              <UserPlus className="w-3 h-3" />
              {showNewClient ? "Buscar existente" : "Novo cliente"}
            </button>
          </div>

          {showNewClient ? (
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nome completo *"
                value={form.newName}
                onChange={(e) => set("newName", e.target.value)}
              />
              <Input
                placeholder="Telefone (WhatsApp) *"
                value={form.newPhone}
                onChange={(e) => set("newPhone", e.target.value)}
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Buscar por nome ou telefone..."
                value={clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); set("clientId", ""); }}
              />
              {clients.length > 0 && !form.clientId && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center"
                      onClick={() => { set("clientId", c.id); setClientSearch(c.name); setClients([]); }}
                    >
                      <span className="font-medium text-gray-900">{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Serviço + Profissional ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Serviço *</label>
            <select
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.serviceId}
              onChange={(e) => { set("serviceId", e.target.value); set("hairLength", ""); }}
            >
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Profissional *</label>
            <select
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
            >
              <option value="">Selecione...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Comprimento (se preço variável) ─────────────────────────────── */}
        {selectedService?.hasPricingByLength && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Comprimento do cabelo</label>
            <div className="flex gap-2">
              {(["SHORT", "MEDIUM", "LONG"] as HairLength[]).map((hl) => (
                <button
                  key={hl}
                  type="button"
                  onClick={() => set("hairLength", hl)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    form.hairLength === hl
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {HAIR_LABELS[hl]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Data + Horário ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data *"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          <Input
            label="Horário *"
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
          />
        </div>

        {/* ── Preço resolvido ──────────────────────────────────────────────── */}
        {resolvedPrice !== null && (
          <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-2">
            <span className="text-sm text-primary-700">Valor do serviço</span>
            <span className="text-sm font-bold text-primary-800">{formatCurrency(resolvedPrice)}</span>
          </div>
        )}

        {/* ── Observações ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Observações</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            placeholder="Observações opcionais..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">
            Criar agendamento
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
