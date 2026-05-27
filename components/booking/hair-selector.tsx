"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  HAIR_ICONS,
  HAIR_TYPE_LABEL,
  HAIR_LENGTH_LABEL,
  HairType,
  HairLength,
} from "@/components/booking/hair-icons";

export interface HairProfile {
  type: HairType;
  length: HairLength;
}

const TYPES: HairType[]   = ["STRAIGHT", "WAVY_CURLY"];
const LENGTHS: HairLength[] = ["SHORT", "MEDIUM", "LONG"];

interface Props {
  onConfirm: (profile: HairProfile) => void;
}

export function HairSelector({ onConfirm }: Props) {
  const [selected, setSelected] = useState<HairProfile | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-900">Qual é o seu tipo de cabelo?</h2>
        <p className="text-sm text-gray-500">
          Isso permite mostrar preços e durações exatos para você
        </p>
      </div>

      <div className="space-y-4">
        {TYPES.map((type) => (
          <div key={type} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-1">
              {HAIR_TYPE_LABEL[type]}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {LENGTHS.map((length) => {
                const Icon = HAIR_ICONS[type][length];
                const isSelected = selected?.type === type && selected?.length === length;

                return (
                  <button
                    key={length}
                    onClick={() => setSelected({ type, length })}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-150",
                      "hover:border-primary-400 hover:bg-primary-50",
                      isSelected
                        ? "border-primary-600 bg-primary-50 shadow-md"
                        : "border-gray-200 bg-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-14 w-14 transition-colors",
                        isSelected
                          ? "text-primary-600"
                          : "text-gray-400 group-hover:text-primary-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary-700" : "text-gray-600"
                      )}
                    >
                      {HAIR_LENGTH_LABEL[length]}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => selected && onConfirm(selected)}
        disabled={!selected}
        className="w-full"
        size="lg"
      >
        Confirmar e ver serviços
      </Button>
    </div>
  );
}
