"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, X, Check, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

type Service = { id: string; name: string };

interface StaffFormProps {
  /** Dados para edição; undefined = criação */
  initialData?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    specialties: string[];
    isActive: boolean;
  };
  services: Service[];
}

export function StaffForm({ initialData, services }: StaffFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const [name, setName] = useState(initialData?.name ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initialData?.specialties ?? []);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.avatarUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.avatarUrl ?? null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Foto ────────────────────────────────────────────────────────────────────

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Foto muito grande. Máximo 5 MB.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return photoUrl; // mantém URL existente

    setUploading(true);
    const form = new FormData();
    form.append("file", photoFile);

    const res = await fetch("/api/staff/upload", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Erro no upload da foto");
    }

    const { url } = await res.json();
    return url as string;
  }

  // ─── Especialidades multiselect ───────────────────────────────────────────────

  function toggleSpecialty(name: string) {
    setSpecialties((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const uploadedUrl = await uploadPhoto();

      const payload = {
        name: name.trim(),
        photoUrl: uploadedUrl,
        specialties,
        isActive,
      };

      const url = isEdit ? `/api/staff/${initialData!.id}` : "/api/staff";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erro ao salvar");
      }

      router.push("/dashboard/profissionais");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  const isLoading = uploading || saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Erro global */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Foto ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Foto do profissional"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
              unoptimized={photoPreview.startsWith("blob:")}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl border-4 border-white shadow">
              {name ? getInitials(name) : "?"}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>

          {photoPreview && (
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {photoPreview ? "Trocar foto" : "Adicionar foto"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx. 5 MB</p>
      </div>

      {/* ─── Nome ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Ana Lima"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* ─── Especialidades ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Especialidades
          <span className="ml-1 text-xs text-gray-400">(baseado nos serviços do salão)</span>
        </label>

        {services.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Cadastre serviços primeiro para selecionar especialidades.
          </p>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className={specialties.length === 0 ? "text-gray-400" : "text-gray-900"}>
                {specialties.length === 0
                  ? "Selecione especialidades…"
                  : `${specialties.length} selecionada${specialties.length > 1 ? "s" : ""}`}
              </span>
              <ChevronDown
                className={cn("w-4 h-4 text-gray-400 transition-transform", dropdownOpen && "rotate-180")}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
                {services.map((svc) => {
                  const checked = specialties.includes(svc.name);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => toggleSpecialty(svc.name)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          checked
                            ? "bg-primary-600 border-primary-600"
                            : "border-gray-300"
                        )}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className={cn(checked && "font-medium text-primary-700")}>
                        {svc.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tags selecionadas */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {specialties.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
              >
                {s}
                <button
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className="hover:text-primary-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Status ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className={cn(
            "relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            isActive ? "bg-primary-600" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
              isActive && "translate-x-4"
            )}
          />
        </button>
        <span className="text-sm text-gray-700">
          Profissional <strong>{isActive ? "ativo" : "inativo"}</strong>
        </span>
      </div>

      {/* ─── Botões ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isLoading} className="flex-1">
          {isLoading
            ? uploading
              ? "Enviando foto…"
              : "Salvando…"
            : isEdit
            ? "Salvar alterações"
            : "Cadastrar profissional"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/profissionais")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
