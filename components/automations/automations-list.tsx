"use client";

import { useState } from "react";
import {
  Zap, Plus, Pencil, Trash2, Send, RefreshCw,
  CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceOption = { id: string; name: string };

type AutomationRule = {
  id:              string;
  serviceId:       string;
  delayDays:       number;
  messageTemplate: string;
  isActive:        boolean;
  createdAt:       string;
  service: {
    id: string; name: string;
    category: { name: string; color: string } | null;
  };
  stats: { sentThisMonth: number; convertedThisMonth: number };
};

interface Props {
  initialRules: AutomationRule[];
  services:     ServiceOption[];
  globalStats:  { totalSent: number; totalConverted: number };
}

// ─── Default template ────────────────────────────────────────────────────────

function defaultTemplate(serviceName: string, delayDays: number) {
  return (
    `Olá, {nome}! 👋\n\n` +
    `Faz ${delayDays} dia${delayDays !== 1 ? "s" : ""} desde o seu último *${serviceName}* aqui no salão. ✨\n\n` +
    `Que tal agendar novamente? Clique no link abaixo:\n{link}\n\n` +
    `Qualquer dúvida, estamos à disposição! 😊`
  );
}

// ─── Rule Form ────────────────────────────────────────────────────────────────

interface RuleFormProps {
  services:    ServiceOption[];
  initial?:    Partial<AutomationRule>;
  onSave:      (data: Omit<AutomationRule, "id" | "createdAt" | "service" | "stats">) => Promise<void>;
  onClose:     () => void;
  saving:      boolean;
}

function RuleForm({ services, initial, onSave, onClose, saving }: RuleFormProps) {
  const [serviceId, setServiceId]             = useState(initial?.serviceId       ?? "");
  const [delayDays, setDelayDays]             = useState(initial?.delayDays       ?? 30);
  const [messageTemplate, setMessageTemplate] = useState(initial?.messageTemplate ?? "");
  const [isActive, setIsActive]               = useState(initial?.isActive        ?? true);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  function handleServiceChange(id: string) {
    setServiceId(id);
    if (!messageTemplate || messageTemplate === defaultTemplate(
      services.find((s) => s.id === initial?.serviceId)?.name ?? "", delayDays
    )) {
      const name = services.find((s) => s.id === id)?.name ?? "";
      setMessageTemplate(defaultTemplate(name, delayDays));
    }
  }

  function handleDelayChange(days: number) {
    setDelayDays(days);
    const name = services.find((s) => s.id === serviceId)?.name ?? "";
    if (messageTemplate === defaultTemplate(name, delayDays)) {
      setMessageTemplate(defaultTemplate(name, days));
    }
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!serviceId)                    errs.serviceId       = "Selecione um serviço";
    if (delayDays < 1 || delayDays > 365) errs.delayDays    = "Entre 1 e 365 dias";
    if (messageTemplate.trim().length < 10) errs.messageTemplate = "Mensagem muito curta (mín. 10 caracteres)";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    await onSave({ serviceId, delayDays, messageTemplate, isActive });
  }

  return (
    <div className="space-y-5">
      {/* Service */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Serviço</label>
        <select
          value={serviceId}
          onChange={(e) => handleServiceChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     bg-white text-gray-900"
        >
          <option value="">Selecione…</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.serviceId && <p className="text-xs text-red-600">{errors.serviceId}</p>}
      </div>

      {/* Delay */}
      <Input
        label="Dias após o atendimento"
        type="number"
        min={1}
        max={365}
        value={delayDays}
        onChange={(e) => handleDelayChange(Number(e.target.value))}
        error={errors.delayDays}
      />

      {/* Template */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Mensagem do WhatsApp
        </label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={7}
          className={`block w-full rounded-lg border px-3 py-2 text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      placeholder:text-gray-400
                      ${errors.messageTemplate ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}`}
          placeholder="Olá, {nome}! Que tal agendar seu {servico}? {link}"
        />
        <p className="text-xs text-gray-400">
          Variáveis:{" "}
          <code className="bg-gray-100 px-1 rounded">{"{nome}"}</code>{" "}
          <code className="bg-gray-100 px-1 rounded">{"{servico}"}</code>{" "}
          <code className="bg-gray-100 px-1 rounded">{"{link}"}</code>
        </p>
        {errors.messageTemplate && (
          <p className="text-xs text-red-600">{errors.messageTemplate}</p>
        )}
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive(!isActive)}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            isActive ? "bg-primary-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {isActive ? "Ativa" : "Inativa"}
        </span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          Salvar regra
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AutomationsList({ initialRules, services, globalStats }: Props) {
  const [rules, setRules]             = useState(initialRules);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<AutomationRule | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(rule: AutomationRule) { setEditing(rule); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  // ── Save (create or update) ────────────────────────────────────────────────

  async function handleSave(
    data: Omit<AutomationRule, "id" | "createdAt" | "service" | "stats">
  ) {
    setSaving(true);
    try {
      if (editing) {
        // Update
        const res = await fetch(`/api/automations/${editing.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setRules((prev) =>
            prev.map((r) =>
              r.id === editing.id
                ? { ...updated, stats: editing.stats }
                : r
            )
          );
          closeModal();
        }
      } else {
        // Create
        const res = await fetch("/api/automations", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });
        if (res.ok) {
          const created = await res.json();
          setRules((prev) => [...prev, created]);
          closeModal();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function handleToggle(rule: AutomationRule) {
    setToggling(rule.id);
    try {
      const res = await fetch(`/api/automations/${rule.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !rule.isActive }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id ? { ...r, isActive: !rule.isActive } : r
          )
        );
      }
    } finally {
      setToggling(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta regra? Os envios agendados também serão cancelados.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Global stats banner */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Mensagens enviadas este mês</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalSent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Retornos gerados este mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {globalStats.totalConverted}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span>
            {rules.length} regra{rules.length !== 1 ? "s" : ""} configurada
            {rules.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" />
          Nova regra
        </Button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
            <Zap className="w-10 h-10 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Nenhuma automação criada</p>
              <p className="text-xs mt-1">
                Crie uma regra para enviar lembretes automáticos após atendimentos.
              </p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Criar primeira regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Color dot */}
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{
                        backgroundColor: rule.service.category?.color ?? "#8B5CF6",
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {rule.service.name}
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600">
                          lembrete em{" "}
                          <strong>{rule.delayDays}</strong>{" "}
                          dia{rule.delayDays !== 1 ? "s" : ""}
                        </span>
                        <Badge
                          variant={rule.isActive ? "success" : "default"}
                          className="ml-1"
                        >
                          {rule.isActive ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                              ATIVO
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5 mr-1" />
                              INATIVO
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Preview of message */}
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                        &ldquo;{rule.messageTemplate.slice(0, 80)}
                        {rule.messageTemplate.length > 80 ? "…" : ""}&rdquo;
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {rule.stats.sentThisMonth} enviada
                          {rule.stats.sentThisMonth !== 1 ? "s" : ""} este mês
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <RefreshCw className="w-3 h-3" />
                          {rule.stats.convertedThisMonth} retorno
                          {rule.stats.convertedThisMonth !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle */}
                    <button
                      title={rule.isActive ? "Desativar" : "Ativar"}
                      disabled={toggling === rule.id}
                      onClick={() => handleToggle(rule)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0
                        ${rule.isActive ? "bg-primary-600" : "bg-gray-300"}
                        disabled:opacity-50`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                          transition-transform
                          ${rule.isActive ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="Editar"
                      onClick={() => openEdit(rule)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="Excluir"
                      loading={deleting === rule.id}
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar regra de automação" : "Nova regra de automação"}
        size="md"
      >
        <RuleForm
          services={services}
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      </Modal>
    </div>
  );
}
