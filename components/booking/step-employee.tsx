"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

export type Employee = {
  id: string;
  name: string;
  color: string;
  role: string | null;
  avatarUrl: string | null;
  specialties: string[];
};

interface Props {
  employees: Employee[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StepEmployee({ employees, selected, onSelect }: Props) {
  if (employees.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-8">
        Nenhum profissional disponível para este serviço.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* ── "Sem preferência" sempre primeiro ── */}
      <EmployeeCard
        id="any"
        name="Sem preferência"
        subtitle="Primeiro disponível"
        color="#6B7280"
        avatarUrl={null}
        isAny
        selected={selected === "any"}
        onSelect={onSelect}
      />

      {employees.map((emp) => (
        <EmployeeCard
          key={emp.id}
          id={emp.id}
          name={emp.name}
          subtitle={emp.role ?? undefined}
          color={emp.color}
          avatarUrl={emp.avatarUrl}
          selected={selected === emp.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function EmployeeCard({
  id,
  name,
  subtitle,
  color,
  avatarUrl,
  isAny,
  selected,
  onSelect,
}: {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  avatarUrl: string | null;
  isAny?: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all",
        "hover:border-primary-400 hover:bg-primary-50",
        selected
          ? "border-primary-600 bg-primary-50 shadow-sm"
          : "border-gray-200 bg-white"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : isAny ? (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color + "22", border: `2px dashed ${color}` }}
          >
            <Users className="w-5 h-5" style={{ color }} />
          </div>
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {getInitials(name)}
          </div>
        )}

        {/* Selected dot */}
        {selected && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-600 border-2 border-white flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <path d="M6.5 1.5L3 5 1.5 3.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {/* Text */}
      <div>
        <p className={cn("text-sm font-semibold", selected ? "text-primary-700" : "text-gray-800")}>
          {name}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </button>
  );
}
