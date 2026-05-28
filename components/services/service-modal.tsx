"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type HairLength = "SHORT" | "MEDIUM" | "LONG";

const HAIR_LENGTHS: { key: HairLength; label: string }[] = [
  { key: "SHORT", label: "Curto" },
  { key: "MEDIUM", label: "Médio" },
  { key: "LONG", label: "Longo" },
];

type Category = { id: string; name: string; color: string };

type Pricing = { hairLength: HairLength; price: string; duration: string };

type ServiceForm = {
  name: string;
  description: string;
  categoryId: string;
  duration: string;
  price: string;
  hasPricingByLength: boolean;
  activeTime: string;
  requiresVirginHairCheck: boolean;
  pricings: Pricing[];
};

const emptyPricings: Pricing[] = HAIR_LENGTHS.map((h) => ({
  hairLength: h.key,
  price: "",
  duration: "",
}));

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  categoryId: "",
  duration: "60",
  price: "",
  hasPricingByLength: false,
  activeTime: "",
  requiresVirginHairCheck: false,
  pricings: emptyPricings,
};

type ServiceData = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  duration: number;
  price: number;
  hasPricingByLength: boolean;
  activeTime: number | null;
  requiresVirginHairCheck: boolean;
  isActive: boolean;
  category: { id: string; name: string; color: string } | null;
  pricings: { hairLength: HairLength; price: number; duration: number | null }[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (service: ServiceData) => void;
  categories: Category[];
  editService?: ServiceData | null;
}

export function ServiceModal({ open, onClose, onSaved, categories, editService }: Props) {
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editService) {
        const pricings = HAIR_LENGTHS.map((h) => {
          const p = editService.pricings.find((x) => x.hairLength === h.key);
          return {
            hairLength: h.key,
            price: p ? String(p.price) : "",
            duration: p?.duration ? String(p.duration) : "",
          };
        });
        setForm({
          name: editService.name,
          description: editService.description ?? "",
          categoryId: editService.categoryId ?? "",
          duration: String(editService.duration),
          price: String(editService.price),
          hasPricingByLength: editService.hasPricingByLength,
          activeTime: editService.activeTime ? String(editService.activeTime) : "",
          requiresVirginHairCheck: editService.requiresVirginHairCheck,
          pricings,
        });
      } else {
        setForm(emptyForm);
      }
      setError("");
    }
  }, [open, editService]);

  function setField<K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setPricingField(index: number, field: "price" | "duration", value: string) {
    setForm((f) => {
      const pricings = [...f.pricings];
      pricings[index] = { ...pricings[index], [field]: value };
      return { ...f, pricings };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.hasPricingByLength && !form.price) { setError("Informe o preço."); return; }
    if (form.hasPricingByLength) {
      for (const p of form.pricings) {
        if (!p.price) { setError(`Informe o preço para cabelo ${HAIR_LENGTHS.find(h => h.key === p.hairLength)!.label}.`); return; }
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        categoryId: form.categoryId || null,
        duration: parseInt(form.duration) || 60,
        price: parseFloat(form.price) || 0,
        hasPricingByLength: form.hasPricingByLength,
        activeTime: form.activeTime ? parseInt(form.activeTime) : null,
        requiresVirginHairCheck: form.requiresVirginHairCheck,
        pricings: form.hasPricingByLength
          ? form.pricings.map((p) => ({
              hairLength: p.hairLength,
              price: parseFloat(p.price),
              duration: p.duration ? parseInt(p.duration) : null,
            }))
          : [],
      };

      const url = editService ? `/api/services/${editService.id}` : "/api/services";
      const method = editService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar serviço.");
        return;
      }

      const saved = await res.json();
      onSaved(saved);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editService ? "Editar serviço" : "Novo serviço"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome + Categoria */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Nome do serviço *"
              placeholder="Ex: Corte Feminino"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <select
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={2}
            placeholder="Descrição opcional"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        {/* Duração base */}
        <Input
          label="Duração base (minutos)"
          type="number"
          min="1"
          value={form.duration}
          onChange={(e) => setField("duration", e.target.value)}
        />

        {/* Tempo ativo da profissional */}
        <div className="space-y-1">
          <Input
            label="Tempo ativo da profissional (min) — opcional"
            type="number"
            min="1"
            placeholder={form.duration || "igual à duração"}
            value={form.activeTime}
            onChange={(e) => setField("activeTime", e.target.value)}
          />
          <p className="text-xs text-gray-400">
            Para serviços onde a cliente aguarda o produto agir (ex: luzes, coloração), preencha
            apenas o tempo que a profissional fica ativa. Após esse período ela pode atender outra cliente.
          </p>
        </div>

        {/* Requer cabelo virgem */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Perguntar se o cabelo é virgem</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Exibe um checkbox no agendamento para serviços químicos e de coloração
            </p>
          </div>
          <Toggle
            checked={form.requiresVirginHairCheck}
            onChange={(v) => setField("requiresVirginHairCheck", v)}
          />
        </div>

        {/* Toggle preço por tamanho */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Preço por tamanho de cabelo</p>
            <p className="text-xs text-gray-500 mt-0.5">Defina preços diferentes para curto, médio e longo</p>
          </div>
          <Toggle
            checked={form.hasPricingByLength}
            onChange={(v) => setField("hasPricingByLength", v)}
          />
        </div>

        {/* Preço único OU tabela por tamanho */}
        {!form.hasPricingByLength ? (
          <Input
            label="Preço (R$) *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.price}
            onChange={(e) => setField("price", e.target.value)}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Preços por tamanho *</p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="px-4 py-2 text-xs font-medium text-gray-600">Tamanho</div>
                <div className="px-4 py-2 text-xs font-medium text-gray-600">Preço (R$)</div>
                <div className="px-4 py-2 text-xs font-medium text-gray-600">Duração (min)</div>
              </div>
              {HAIR_LENGTHS.map((h, i) => (
                <div
                  key={h.key}
                  className={cn(
                    "grid grid-cols-3 items-center",
                    i < HAIR_LENGTHS.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <div className="px-4 py-2.5 text-sm font-medium text-gray-800">{h.label}</div>
                  <div className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={form.pricings[i].price}
                      onChange={(e) => setPricingField(i, "price", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      placeholder={form.duration}
                      value={form.pricings[i].duration}
                      onChange={(e) => setPricingField(i, "duration", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Duração em branco usa a duração base.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">
            {editService ? "Salvar alterações" : "Criar serviço"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
