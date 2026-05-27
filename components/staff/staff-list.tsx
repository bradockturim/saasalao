"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, UserX, UserCheck, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

type Staff = {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialties: string[];
  isActive: boolean;
  _count: { appointments: number };
};

interface StaffListProps {
  initialStaff: Staff[];
}

export function StaffList({ initialStaff }: StaffListProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(member: Staff) {
    setTogglingId(member.id);
    setError(null);

    const res = await fetch(`/api/staff/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });

    if (res.ok) {
      startTransition(() => {
        setStaff((prev) =>
          prev.map((s) => (s.id === member.id ? { ...s, isActive: !s.isActive } : s))
        );
      });
    } else {
      const json = await res.json();
      setError(json.error ?? "Erro ao atualizar status");
    }
    setTogglingId(null);
  }

  async function handleDelete(member: Staff) {
    if (!confirm(`Excluir ${member.name}? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(member.id);
    setError(null);

    const res = await fetch(`/api/staff/${member.id}`, { method: "DELETE" });

    if (res.ok) {
      startTransition(() => {
        setStaff((prev) => prev.filter((s) => s.id !== member.id));
      });
    } else {
      const json = await res.json();
      setError(json.error ?? "Erro ao excluir profissional");
    }
    setDeletingId(null);
  }

  const active = staff.filter((s) => s.isActive);
  const inactive = staff.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {active.length} ativo{active.length !== 1 ? "s" : ""} · {inactive.length} inativo{inactive.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/profissionais/novo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Novo profissional
          </Button>
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {staff.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum profissional cadastrado ainda.</p>
          <Link href="/dashboard/profissionais/novo">
            <Button variant="secondary" size="sm" className="mt-4">
              Cadastrar primeiro profissional
            </Button>
          </Link>
        </div>
      )}

      {/* Ativos */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ativos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {active.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isToggling={togglingId === member.id}
                isDeleting={deletingId === member.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inativos */}
      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inativos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inactive.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isToggling={togglingId === member.id}
                isDeleting={deletingId === member.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function StaffCard({
  member,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  member: Staff;
  onToggle: (m: Staff) => void;
  onDelete: (m: Staff) => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const hasFutureApts = member._count.appointments > 0;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-opacity",
        !member.isActive && "opacity-60"
      )}
    >
      {/* Foto + nome */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {getInitials(member.name)}
            </div>
          )}
          {/* Badge ativo/inativo */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
              member.isActive ? "bg-green-400" : "bg-gray-300"
            )}
          />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{member.name}</p>
          {hasFutureApts && !member.isActive && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {member._count.appointments} agend. futuros
            </span>
          )}
          {member.isActive && (
            <span className="text-[10px] text-green-600 font-medium">Ativo</span>
          )}
        </div>
      </div>

      {/* Especialidades */}
      {member.specialties.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {member.specialties.slice(0, 3).map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-[10px] font-medium"
            >
              {s}
            </span>
          ))}
          {member.specialties.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px]">
              +{member.specialties.length - 3}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic">Sem especialidades cadastradas</p>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Link href={`/dashboard/profissionais/${member.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full gap-1">
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
        </Link>

        <button
          onClick={() => onToggle(member)}
          disabled={isToggling}
          title={member.isActive ? "Desativar" : "Ativar"}
          className={cn(
            "p-2 rounded-lg border transition-colors",
            member.isActive
              ? "text-amber-600 border-amber-200 hover:bg-amber-50"
              : "text-green-600 border-green-200 hover:bg-green-50"
          )}
        >
          {member.isActive ? (
            <UserX className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onDelete(member)}
          disabled={isDeleting}
          title="Excluir"
          className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
