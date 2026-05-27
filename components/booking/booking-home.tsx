"use client";

import { useEffect, useState } from "react";
import { Scissors, MapPin, Phone } from "lucide-react";
import { HairSelector, HairProfile } from "@/components/booking/hair-selector";
import { ServiceCatalog } from "@/components/booking/service-catalog";
import { cn } from "@/lib/utils";

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type WorkingHour = { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean };
type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  hasPricingByLength: boolean;
  category: { id: string; name: string; color: string } | null;
  pricings: { hairLength: "SHORT" | "MEDIUM" | "LONG"; price: number; duration: number | null }[];
};
type Salon = {
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  workingHours: WorkingHour[];
};

interface Props {
  salon: Salon;
  services: Service[];
}

function getProfileKey(slug: string) {
  return `hairProfile_${slug}`;
}

type Screen = "selector" | "catalog";

export function BookingHome({ salon, services }: Props) {
  const [screen, setScreen] = useState<Screen>("selector");
  const [hairProfile, setHairProfile] = useState<HairProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(getProfileKey(salon.slug));
    if (stored) {
      try {
        const p = JSON.parse(stored) as HairProfile;
        setHairProfile(p);
        setScreen("catalog");
      } catch {
        // ignore malformed storage
      }
    }
    setHydrated(true);
  }, [salon.slug]);

  function handleConfirm(profile: HairProfile) {
    setHairProfile(profile);
    localStorage.setItem(getProfileKey(salon.slug), JSON.stringify(profile));
    setScreen("catalog");
  }

  function handleChangeProfile() {
    setScreen("selector");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shrink-0">
            {salon.logoUrl ? (
              <img src={salon.logoUrl} alt={salon.name} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <Scissors className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{salon.name}</h1>
            <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 flex-wrap">
              {salon.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {salon.city}{salon.state && `, ${salon.state}`}
                </span>
              )}
              {salon.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {salon.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Working hours ribbon */}
        {salon.workingHours.some((h) => h.isOpen) && (
          <div className="max-w-lg mx-auto px-4 pb-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {salon.workingHours.map((wh) => (
                <div
                  key={wh.dayOfWeek}
                  className={cn(
                    "shrink-0 text-center rounded-lg px-2.5 py-1.5",
                    wh.isOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase">{DAY_SHORT[wh.dayOfWeek]}</p>
                  <p className="text-[10px] mt-0.5">
                    {wh.isOpen ? `${wh.openTime}–${wh.closeTime}` : "Fechado"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {!hydrated ? (
          // Skeleton while localStorage is loading
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : screen === "selector" ? (
          <HairSelector onConfirm={handleConfirm} />
        ) : (
          hairProfile && (
            <ServiceCatalog
              services={services}
              salonSlug={salon.slug}
              hairProfile={hairProfile}
              onChangeProfile={handleChangeProfile}
            />
          )
        )}
      </div>
    </div>
  );
}
