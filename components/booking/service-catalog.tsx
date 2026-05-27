"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { Clock, ChevronRight, Tag, Pencil } from "lucide-react";
import type { HairProfile } from "@/components/booking/hair-selector";
import { HAIR_ICONS, HAIR_LENGTH_LABEL, HAIR_TYPE_LABEL } from "@/components/booking/hair-icons";

type Pricing = { hairLength: "SHORT" | "MEDIUM" | "LONG"; price: number; duration: number | null };

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  hasPricingByLength: boolean;
  category: { id: string; name: string; color: string } | null;
  pricings: Pricing[];
};

interface Props {
  services: Service[];
  salonSlug: string;
  hairProfile: HairProfile;
  onChangeProfile: () => void;
}

function resolvePrice(service: Service, hairLength: HairProfile["length"]) {
  if (!service.hasPricingByLength) return { price: service.price, duration: service.duration };
  const p = service.pricings.find((x) => x.hairLength === hairLength);
  if (!p) return { price: service.price, duration: service.duration };
  return { price: p.price, duration: p.duration ?? service.duration };
}

function priceRange(service: Service) {
  if (!service.hasPricingByLength || service.pricings.length === 0)
    return formatCurrency(service.price);
  const prices = service.pricings.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

export function ServiceCatalog({ services, salonSlug, hairProfile, onChangeProfile }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: "Todos" },
    ...Array.from(
      new Map(
        services
          .filter((s) => s.category)
          .map((s) => [s.category!.id, s.category!])
      ).values()
    ),
  ];

  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category?.id === activeCategory);

  const HairIcon = HAIR_ICONS[hairProfile.type][hairProfile.length];

  return (
    <div className="space-y-6">
      {/* Hair profile chip */}
      <button
        onClick={onChangeProfile}
        className="flex items-center gap-2.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 hover:bg-primary-100 transition-colors group"
      >
        <HairIcon className="h-8 w-8 text-primary-600 shrink-0" />
        <div className="text-left">
          <p className="text-xs text-primary-500 font-medium">Seu perfil capilar</p>
          <p className="text-sm font-semibold text-primary-800">
            {HAIR_TYPE_LABEL[hairProfile.type]} · {HAIR_LENGTH_LABEL[hairProfile.length]}
          </p>
        </div>
        <Pencil className="w-3.5 h-3.5 text-primary-400 ml-auto group-hover:text-primary-600" />
      </button>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Service list */}
      <div className="space-y-3">
        {filtered.map((service) => {
          const { price, duration } = resolvePrice(service, hairProfile.length);
          const isCustomPrice = service.hasPricingByLength;

          return (
            <Link
              key={service.id}
              href={`/book/${salonSlug}/book?serviceId=${service.id}`}
              className="group block bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary-400 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {service.name}
                    </span>
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
                    <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {duration} min
                    </span>
                    {isCustomPrice ? (
                      <span className="font-semibold text-primary-700">{formatCurrency(price)}</span>
                    ) : (
                      <span className="font-semibold text-primary-700">{priceRange(service)}</span>
                    )}
                    {isCustomPrice && (
                      <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full font-medium">
                        Preço para seu cabelo
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white group-hover:bg-primary-700 transition-colors">
                    Agendar
                    <ChevronRight className="w-4 h-4" />
                  </span>
                  <ChevronRight className="sm:hidden w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          Nenhum serviço nesta categoria.
        </div>
      )}
    </div>
  );
}
