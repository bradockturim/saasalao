"use client";

import { useState } from "react";
import { ServiceModal } from "@/components/services/service-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, Clock, Tag } from "lucide-react";

type HairLength = "SHORT" | "MEDIUM" | "LONG";

const HAIR_LABEL: Record<HairLength, string> = {
  SHORT: "Curto",
  MEDIUM: "Médio",
  LONG: "Longo",
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  duration: number;
  price: number;
  hasPricingByLength: boolean;
  isActive: boolean;
  category: { id: string; name: string; color: string } | null;
  pricings: { hairLength: HairLength; price: number; duration: number | null }[];
};

type Category = { id: string; name: string; color: string };

interface Props {
  initialServices: Service[];
  categories: Category[];
}

export function ServicesList({ initialServices, categories }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);

  function handleSaved(saved: Service) {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  async function toggleActive(service: Service) {
    const res = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      handleSaved(updated);
    }
  }

  function openEdit(service: Service) {
    setEditTarget(service);
    setModalOpen(true);
  }

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  const active = services.filter((s) => s.isActive);
  const inactive = services.filter((s) => !s.isActive);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{active.length} serviços ativos</p>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" />
          Novo serviço
        </Button>
      </div>

      <div className="space-y-3">
        {services.length === 0 && (
          <Card>
            <div className="py-12 text-center text-sm text-gray-500">
              Nenhum serviço cadastrado ainda.
            </div>
          </Card>
        )}

        {[...active, ...inactive].map((service) => (
          <Card
            key={service.id}
            className={service.isActive ? "" : "opacity-60"}
          >
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{service.name}</span>
                  {!service.isActive && (
                    <Badge variant="danger">Inativo</Badge>
                  )}
                  {service.category && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: service.category.color + "22",
                        color: service.category.color,
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {service.category.name}
                    </span>
                  )}
                </div>

                {service.description && (
                  <p className="text-sm text-gray-500">{service.description}</p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration} min
                  </span>

                  {!service.hasPricingByLength ? (
                    <span className="text-sm font-medium text-primary-700">
                      {formatCurrency(service.price)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      {service.pricings.map((p) => (
                        <div key={p.hairLength} className="text-sm">
                          <span className="text-gray-500">{HAIR_LABEL[p.hairLength]}: </span>
                          <span className="font-medium text-primary-700">{formatCurrency(p.price)}</span>
                          {p.duration && (
                            <span className="text-gray-400 text-xs ml-1">({p.duration}min)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(service)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(service)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  title={service.isActive ? "Desativar" : "Ativar"}
                >
                  {service.isActive
                    ? <ToggleRight className="w-4 h-4 text-green-500" />
                    : <ToggleLeft className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        categories={categories}
        editService={editTarget}
      />
    </>
  );
}
