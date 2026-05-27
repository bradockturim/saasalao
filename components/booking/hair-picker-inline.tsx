"use client";

import { cn } from "@/lib/utils";
import { HAIR_TYPE_LABEL, HAIR_LENGTH_LABEL, type HairType, type HairLength } from "./hair-icons";

const TYPES:   HairType[]   = ["STRAIGHT", "WAVY_CURLY"];
const LENGTHS: HairLength[] = ["SHORT",    "MEDIUM",    "LONG"];

interface HairProfile { type: HairType; length: HairLength }

interface Props {
  current:  HairProfile;
  onChange: (p: HairProfile) => void;
}

export function HairPickerInline({ current, onChange }: Props) {
  return (
    <div className="space-y-3 pt-1">
      {/* Type row */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">Tipo</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...current, type: t })}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-medium border transition-all",
                current.type === t
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
              )}
            >
              {HAIR_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Length row */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">Comprimento</p>
        <div className="grid grid-cols-3 gap-2">
          {LENGTHS.map((l) => (
            <button
              key={l}
              onClick={() => onChange({ ...current, length: l })}
              className={cn(
                "rounded-xl px-2 py-2 text-xs font-medium border transition-all",
                current.length === l
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-300"
              )}
            >
              {HAIR_LENGTH_LABEL[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
