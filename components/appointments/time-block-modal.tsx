"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Employee = { id: string; name: string; color: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (block: unknown) => void;
  employees: Employee[];
  defaultDate?: string; // "YYYY-MM-DD"
}

export function TimeBlockModal({ open, onClose, onCreated, employees, defaultDate }: Props) {
  const [form, setForm] = useState({
    employeeId: "",
    date:       "",
    startTime:  "",
    endTime:    "",
    reason:     "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        employeeId: "",
        date:       defaultDate ?? new Date().toISOString().split("T")[0],
        startTime:  "",
        endTime:    "",
        reason:     "",
      });
      setError("");
    }
  }, [open, defaultDate]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.date)      { setError("Informe a data."); return; }
    if (!form.startTime) { setError("Informe o horário de início."); return; }
    if (!form.endTime)   { setError("Informe o horário de fim."); return; }
    if (form.endTime <= form.startTime) { setError("Horário de fim deve ser após o início."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/time-blocks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId || null,
          date:       form.date,
          startTime:  form.startTime,
          endTime:    form.endTime,
          reason:     form.reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar bloqueio."); return; }
      onCreated(data);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bloquear horário" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Profissional */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Profissional</label>
          <select
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={form.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
          >
            <option value="">Todos os profissionais</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Deixe em branco para bloquear o horário de todos.
          </p>
        </div>

        {/* Data */}
        <Input
          label="Data *"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />

        {/* Início + Fim */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Das *"
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
          <Input
            label="Até *"
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </div>

        {/* Motivo */}
        <Input
          label="Motivo (opcional)"
          placeholder="Ex: Almoço, Folga, Reunião..."
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
        />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">
            Bloquear horário
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
