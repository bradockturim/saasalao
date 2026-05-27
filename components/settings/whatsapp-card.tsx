"use client";

import { useState } from "react";
import {
  MessageCircle, CheckCircle2, XCircle,
  Send, Lock, ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { applyPhoneMask } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Props {
  salonId: string;
  initialPhone: string | null;
  initialNotifyNew: boolean;
}

type TestStatus = "idle" | "loading" | "ok" | "error";

export function WhatsAppCard({ salonId, initialPhone, initialNotifyNew }: Props) {
  const [phone,        setPhone]        = useState(
    // Exibe com máscara se já estiver salvo (número cru → mascarado)
    initialPhone ? applyPhoneMask(initialPhone) : ""
  );
  const [notifyNew,    setNotifyNew]    = useState(initialNotifyNew);
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState<string | null>(null);
  const [testStatus,   setTestStatus]   = useState<TestStatus>("idle");
  const [testMessage,  setTestMessage]  = useState<string | null>(null);

  // ─── Input mask ─────────────────────────────────────────────────────────────
  function handlePhoneChange(raw: string) {
    setPhone(applyPhoneMask(raw));
    // Limpa feedback ao editar
    setTestStatus("idle");
    setTestMessage(null);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);

    // Salva número sem máscara
    const rawPhone = phone.replace(/\D/g, "") || null;

    const res = await fetch(`/api/salons/${salonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber: rawPhone,
        whatsappNotifyNew: notifyNew,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setSavedMsg("Salvo com sucesso!");
      setTimeout(() => setSavedMsg(null), 3000);
    } else {
      setSavedMsg("Erro ao salvar. Tente novamente.");
    }
  }

  // ─── Test ────────────────────────────────────────────────────────────────────
  async function handleTest() {
    const rawPhone = phone.replace(/\D/g, "");
    if (rawPhone.length < 10) {
      setTestStatus("error");
      setTestMessage("Informe um número válido com DDD antes de testar.");
      return;
    }

    setTestStatus("loading");
    setTestMessage(null);

    const res = await fetch(`/api/salons/${salonId}/whatsapp/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (res.ok) {
      setTestStatus("ok");
      setTestMessage(`Mensagem enviada para ${data.sentTo} ✅`);
    } else {
      setTestStatus("error");
      setTestMessage(data.error ?? "Falha no envio da mensagem de teste.");
    }
  }

  const hasPhone = phone.replace(/\D/g, "").length >= 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">WhatsApp</h2>
            <p className="text-xs text-gray-500">Receba notificações de agendamentos</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Número ─────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Número do WhatsApp da dona
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {/* Flag BR */}
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base select-none">
                🇧🇷
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(21) 99999-9999"
                maxLength={15}
                className={cn(
                  "w-full pl-9 pr-3 py-2 rounded-lg border text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  testStatus === "ok"
                    ? "border-green-400 bg-green-50"
                    : testStatus === "error"
                    ? "border-red-300"
                    : "border-gray-300"
                )}
              />
            </div>

            {/* Botão Testar */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleTest}
              loading={testStatus === "loading"}
              disabled={!hasPhone || testStatus === "loading"}
              className="gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Testar conexão
            </Button>
          </div>

          {/* Feedback do teste */}
          {testStatus !== "idle" && testMessage && (
            <div
              className={cn(
                "flex items-start gap-2 text-xs rounded-lg px-3 py-2 mt-1",
                testStatus === "ok"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              {testStatus === "ok" ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" />
              ) : (
                <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Número que receberá as notificações. Deve ser um número com WhatsApp ativo.
          </p>
        </div>

        {/* ── Toggles ────────────────────────────────────────────────────── */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {/* Toggle 1 — Novo agendamento */}
          <ToggleRow
            label="Notificar novo agendamento"
            description="Receba uma mensagem quando uma cliente agendar pelo site"
            checked={notifyNew}
            onChange={setNotifyNew}
          />

          {/* Toggle 2 — Resumo diário (backlog: desabilitado) */}
          <ToggleRow
            label="Resumo diário às 20h"
            description="Lista de agendamentos do dia seguinte enviada todo dia às 20h"
            checked={false}
            onChange={() => {}}
            disabled
            badge="Em breve"
          />
        </div>

        {/* ── Aviso Z-API ────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-px text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium">Configuração necessária no servidor</p>
            <p className="text-amber-700">
              Para o envio funcionar, adicione{" "}
              <code className="bg-amber-100 px-1 rounded font-mono">ZAPI_INSTANCE_ID</code> e{" "}
              <code className="bg-amber-100 px-1 rounded font-mono">ZAPI_TOKEN</code> nas
              variáveis de ambiente.{" "}
              <a
                href="https://app.z-api.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 underline font-medium hover:text-amber-900"
              >
                Criar conta Z-API grátis
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* ── Salvar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="button" onClick={handleSave} loading={saving}>
            Salvar configurações
          </Button>
          {savedMsg && (
            <span
              className={cn(
                "text-sm font-medium",
                savedMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"
              )}
            >
              {savedMsg}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", disabled ? "text-gray-400" : "text-gray-700")}>
            {label}
          </p>
          {badge && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded uppercase tracking-wide">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
