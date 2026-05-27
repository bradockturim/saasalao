"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkingHoursForm } from "@/components/settings/working-hours-form";
import { WhatsAppCard } from "@/components/settings/whatsapp-card";

type Salon = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  whatsappNumber: string | null;
  whatsappNotifyNew: boolean;
  cancellationHours: number;
  workingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }[];
};

// ─── Cancellation settings card ──────────────────────────────────────────────

function CancellationCard({
  salonId,
  initialHours,
}: {
  salonId:      string;
  initialHours: number;
}) {
  const [hours,   setHours]   = useState(initialHours);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  async function handleSave() {
    if (hours < 1 || hours > 72) { setError("Entre 1 e 72 horas."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/salons/${salonId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ cancellationHours: hours }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Autoatendimento da Cliente</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configurações da área &ldquo;Meus Agendamentos&rdquo; no portal público.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Antecedência mínima para cancelamento
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={72}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">horas antes do atendimento</span>
          </div>
          <p className="text-xs text-gray-400">
            A cliente só poderá cancelar pelo portal até {hours}h antes do horário marcado.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} loading={loading}>
            Salvar
          </Button>
          {saved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function SettingsForm({ salon }: { salon: Salon }) {
  const [form, setForm] = useState({
    name: salon.name,
    email: salon.email,
    phone: salon.phone ?? "",
    address: salon.address ?? "",
    city: salon.city ?? "",
    state: salon.state ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/salons/${salon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Informações do salão</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome do salão"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Código (slug)</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono">
                  {salon.slug}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Input
              label="Endereço"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cidade"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="Estado"
                value={form.state}
                maxLength={2}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Salvar alterações
              </Button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">Salvo com sucesso!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <WorkingHoursForm initialHours={salon.workingHours} />

      {/* Client self-service */}
      <CancellationCard salonId={salon.id} initialHours={salon.cancellationHours} />

      <WhatsAppCard
        salonId={salon.id}
        initialPhone={salon.whatsappNumber}
        initialNotifyNew={salon.whatsappNotifyNew}
      />
    </div>
  );
}
