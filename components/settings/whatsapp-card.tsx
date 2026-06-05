"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, CheckCircle2, XCircle,
  Send, Wifi, WifiOff, Loader2, RefreshCw,
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
  initialDailySummary?: boolean;
}

type TestStatus = "idle" | "loading" | "ok" | "error";
type WahaStatus = "idle" | "loading" | "WORKING" | "SCAN_QR_CODE" | "STARTING" | "STOPPED" | "ERROR" | "NOT_CONFIGURED";

export function WhatsAppCard({ salonId, initialPhone, initialNotifyNew, initialDailySummary = false }: Props) {
  const [phone,         setPhone]         = useState(initialPhone ? applyPhoneMask(initialPhone) : "");
  const [notifyNew,     setNotifyNew]     = useState(initialNotifyNew);
  const [dailySummary,  setDailySummary]  = useState(initialDailySummary);
  const [saving,      setSaving]      = useState(false);
  const [savedMsg,    setSavedMsg]    = useState<string | null>(null);
  const [testStatus,  setTestStatus]  = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const [wahaStatus, setWahaStatus] = useState<WahaStatus>("idle");
  const [qrCode,     setQrCode]     = useState<string | null>(null);
  const [showQr,     setShowQr]     = useState(false);
  const [qrRefresh,  setQrRefresh]  = useState(Date.now());
  const [wahaError,  setWahaError]  = useState<string | null>(null);

  // ─── Busca status da conexão WAHA ────────────────────────────────────────────
  const checkWaha = useCallback(async (showLoading = false) => {
    if (showLoading) setWahaStatus("loading");
    try {
      const res = await fetch("/api/whatsapp/session");
      const data = await res.json();

      if (!data.configured) {
        setWahaStatus("NOT_CONFIGURED");
        return;
      }

      setWahaStatus(data.status ?? "ERROR");
      setQrCode(data.qr ?? null);
      setWahaError(data.error ?? null);

      if (data.status === "WORKING") {
        setShowQr(false);
        setWahaError(null);
      }
    } catch {
      setWahaStatus("ERROR");
      setWahaError("Erro ao conectar com o servidor WAHA.");
    }
  }, []);

  // Verifica ao montar (com loading)
  useEffect(() => {
    checkWaha(true);
  }, [checkWaha]);

  // Poll silencioso a cada 3s enquanto o QR está visível
  useEffect(() => {
    if (!showQr) return;
    const interval = setInterval(() => checkWaha(false), 3000);
    return () => clearInterval(interval);
  }, [showQr, checkWaha]);

  function handleConnect() {
    setShowQr(true);
    checkWaha(true);
  }

  // ─── Input mask ──────────────────────────────────────────────────────────────
  function handlePhoneChange(raw: string) {
    setPhone(applyPhoneMask(raw));
    setTestStatus("idle");
    setTestMessage(null);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);
    const rawPhone = phone.replace(/\D/g, "") || null;
    const res = await fetch(`/api/salons/${salonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumber: rawPhone, whatsappNotifyNew: notifyNew, whatsappDailySummary: dailySummary }),
    });
    setSaving(false);
    setSavedMsg(res.ok ? "Salvo com sucesso!" : "Erro ao salvar. Tente novamente.");
    if (res.ok) setTimeout(() => setSavedMsg(null), 3000);
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

  const hasPhone    = phone.replace(/\D/g, "").length >= 10;
  const isConnected = wahaStatus === "WORKING";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">WhatsApp</h2>
            <p className="text-xs text-gray-500">Receba notificações de agendamentos</p>
          </div>
          {/* Status badge */}
          {wahaStatus !== "idle" && wahaStatus !== "NOT_CONFIGURED" && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
              isConnected
                ? "bg-green-50 text-green-700"
                : wahaStatus === "loading"
                ? "bg-gray-100 text-gray-500"
                : "bg-red-50 text-red-600"
            )}>
              {wahaStatus === "loading" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isConnected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {wahaStatus === "loading" ? "Verificando..." : isConnected ? "Conectado" : "Desconectado"}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* ── Conexão WhatsApp ────────────────────────────────────────────── */}
        {wahaStatus !== "NOT_CONFIGURED" && (
          <div className="space-y-3">
            {!isConnected && !showQr && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleConnect}
                className="gap-2 w-full"
                loading={wahaStatus === "loading"}
              >
                <MessageCircle className="w-4 h-4" />
                Conectar WhatsApp
              </Button>
            )}

            {/* QR Code */}
            {showQr && !isConnected && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                {wahaStatus === "SCAN_QR_CODE" ? (
                  <>
                    <p className="text-sm font-medium text-gray-700">
                      Escaneie com o WhatsApp do celular
                    </p>
                    {/* Usa endpoint dedicado que retorna a imagem diretamente */}
                    <img
                      src={`/api/whatsapp/qr?t=${Date.now()}`}
                      alt="QR Code WhatsApp"
                      width={200}
                      height={200}
                      className="rounded-lg"
                      key={qrRefresh}
                    />
                    <p className="text-xs text-gray-400 text-center">
                      WhatsApp → Aparelhos conectados → Conectar aparelho
                    </p>
                    <button
                      onClick={() => { setQrRefresh(Date.now()); checkWaha(); }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Atualizar QR Code
                    </button>
                  </>
                ) : wahaStatus === "ERROR" ? (
                  <div className="flex flex-col items-center gap-3 py-2 text-center">
                    <WifiOff className="w-6 h-6 text-red-400" />
                    <p className="text-sm text-red-600 font-medium">Falha na conexão</p>
                    {wahaError && (
                      <p className="text-xs text-gray-500 max-w-xs">{wahaError}</p>
                    )}
                    <button
                      onClick={() => { setShowQr(false); setTimeout(handleConnect, 100); }}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                    <p className="text-sm text-gray-500">
                      {wahaStatus === "STOPPED" || wahaStatus === "STARTING"
                        ? "Iniciando sessão WhatsApp..."
                        : "Aguardando QR Code..."}
                    </p>
                    <p className="text-xs text-gray-400">Pode levar até 30s se o servidor estiver dormindo</p>
                  </div>
                )}
              </div>
            )}

            {/* Conectado com sucesso */}
            {isConnected && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                WhatsApp conectado e pronto para enviar notificações.
              </div>
            )}
          </div>
        )}

        {/* ── Número ─────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Número que receberá as notificações
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
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
                  "w-full pl-9 pr-3 py-2 rounded-xl border text-sm transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
                  testStatus === "ok"
                    ? "border-green-400 bg-green-50"
                    : testStatus === "error"
                    ? "border-red-300"
                    : "border-[#EDD5DF] hover:border-primary-300"
                )}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleTest}
              loading={testStatus === "loading"}
              disabled={!hasPhone || testStatus === "loading" || !isConnected}
              className="gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Testar
            </Button>
          </div>

          {testStatus !== "idle" && testMessage && (
            <div className={cn(
              "flex items-start gap-2 text-xs rounded-xl px-3 py-2 mt-1 border",
              testStatus === "ok"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}>
              {testStatus === "ok"
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" />
                : <XCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
              }
              <span>{testMessage}</span>
            </div>
          )}

          {!isConnected && hasPhone && (
            <p className="text-xs text-gray-400">
              Conecte o WhatsApp acima antes de testar o envio.
            </p>
          )}
        </div>

        {/* ── Toggles ────────────────────────────────────────────────────── */}
        <div className="space-y-3 border-t pt-4" style={{ borderColor: "#EDD5DF" }}>
          <ToggleRow
            label="Notificar novo agendamento"
            description="Receba uma mensagem quando uma cliente agendar pelo site"
            checked={notifyNew}
            onChange={setNotifyNew}
          />
          <ToggleRow
            label="Resumo diário às 20h"
            description="Lista de agendamentos do dia seguinte enviada todo dia às 20h"
            checked={dailySummary}
            onChange={setDailySummary}
          />
        </div>

        {/* ── Salvar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="button" onClick={handleSave} loading={saving}>
            Salvar configurações
          </Button>
          {savedMsg && (
            <span className={cn(
              "text-sm font-medium",
              savedMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"
            )}>
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
  label, description, checked, onChange, disabled, badge,
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
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
