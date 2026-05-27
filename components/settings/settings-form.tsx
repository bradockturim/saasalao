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
  workingHours: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }[];
};

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

      <WhatsAppCard
        salonId={salon.id}
        initialPhone={salon.whatsappNumber}
        initialNotifyNew={salon.whatsappNotifyNew}
      />
    </div>
  );
}
