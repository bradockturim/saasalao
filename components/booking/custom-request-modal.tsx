"use client";

import { useState } from "react";
import { X, Send, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  salonSlug: string;
  onClose:   () => void;
}

type Phase = "form" | "done";

function Field({
  label, required, id, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          placeholder:text-gray-400"
        {...props}
      />
    </div>
  );
}

export function CustomRequestModal({ salonSlug, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    serviceName:  "",
    notes:        "",
    timeSlot1:    "",
    timeSlot2:    "",
    timeSlot3:    "",
    clientName:   "",
    clientPhone:  "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.serviceName.trim() || !form.clientName.trim() || !form.clientPhone.trim() || !form.timeSlot1.trim()) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/public/${salonSlug}/custom-request`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar."); return; }
      setPhase("done");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Agendamento Personalizado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {phase === "done" ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Pedido enviado!</p>
                <p className="text-sm text-gray-500 mt-1">
                  A equipe do salão entrará em contato pelo WhatsApp para confirmar seu horário.
                </p>
              </div>
              <Button onClick={onClose} className="mt-2">Fechar</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Não encontrou o horário ideal? Envie sua preferência e entraremos em contato.
              </p>

              {/* Service */}
              <Field
                id="serviceName" label="Serviço de interesse" required
                placeholder="Ex: Progressiva, Hidratação, Corte…"
                value={form.serviceName}
                onChange={(e) => set("serviceName", e.target.value)}
              />

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Alguma preferência ou informação adicional…"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Time slots */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Horários de preferência <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-400">Informe até 3 opções (dia da semana, período ou horário)</p>
                <Field
                  id="slot1" label="" required
                  placeholder="Ex: Segunda à tarde, ou 14/07 às 15h"
                  value={form.timeSlot1}
                  onChange={(e) => set("timeSlot1", e.target.value)}
                />
                <Field
                  id="slot2" label=""
                  placeholder="2ª opção (opcional)"
                  value={form.timeSlot2}
                  onChange={(e) => set("timeSlot2", e.target.value)}
                />
                <Field
                  id="slot3" label=""
                  placeholder="3ª opção (opcional)"
                  value={form.timeSlot3}
                  onChange={(e) => set("timeSlot3", e.target.value)}
                />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Seus dados para contato</p>
                <Field
                  id="clientName" label="Nome completo" required
                  placeholder="Maria Silva"
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                />
                <Field
                  id="clientPhone" label="WhatsApp" required type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.clientPhone}
                  onChange={(e) => set("clientPhone", e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                loading={loading}
                size="lg"
                className="w-full"
              >
                <Send className="w-4 h-4" />
                Enviar pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
