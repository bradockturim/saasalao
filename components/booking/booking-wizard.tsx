"use client";

import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Tag, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepEmployee, Employee } from "@/components/booking/step-employee";
import { StepDate } from "@/components/booking/step-date";
import { StepSlots } from "@/components/booking/step-slots";
import { StepInfo } from "@/components/booking/step-info";
import {
  HAIR_ICONS,
  HAIR_LENGTH_LABEL,
  HairType,
  HairLength,
} from "@/components/booking/hair-icons";
import { cn, formatCurrency, formatTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Pricing = { hairLength: HairLength; price: number; duration: number | null };

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  hasPricingByLength: boolean;
  category: { name: string; color: string } | null;
  pricings: Pricing[];
};

type Salon = { id: string; name: string; slug: string };

interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

// "any" = sem preferência escolhida, null = ainda não selecionou
type Step = "professional" | "date" | "slots" | "info" | "done";

interface State {
  step: Step;
  employees: Employee[];
  employeeId: string | null; // "any" | actual-id | null
  date: string | null;
  time: string | null;
  client: ClientInfo;
  hairProfile: { type: HairType; length: HairLength } | null;
  submitting: boolean;
  error: string;
  bookingRef: string | null;
  assignedEmployeeName: string | null; // resolved after submit
  workingHours: { dayOfWeek: number; isOpen: boolean }[];
}

type Action =
  | { type: "SET_EMPLOYEES"; employees: Employee[] }
  | { type: "SET_WORKING_HOURS"; hours: { dayOfWeek: number; isOpen: boolean }[] }
  | { type: "SET_HAIR_PROFILE"; profile: { type: HairType; length: HairLength } }
  | { type: "SELECT_EMPLOYEE"; id: string }
  | { type: "SELECT_DATE"; date: string }
  | { type: "SELECT_TIME"; time: string }
  | { type: "SET_CLIENT"; client: ClientInfo }
  | { type: "BACK" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; ref: string; employeeName: string }
  | { type: "SUBMIT_ERROR"; msg: string };

const STEP_ORDER: Step[] = ["professional", "date", "slots", "info", "done"];

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_EMPLOYEES":
      return { ...state, employees: action.employees };
    case "SET_WORKING_HOURS":
      return { ...state, workingHours: action.hours };
    case "SET_HAIR_PROFILE":
      return { ...state, hairProfile: action.profile };
    case "SELECT_EMPLOYEE":
      return { ...state, employeeId: action.id, step: "date" };
    case "SELECT_DATE":
      return { ...state, date: action.date, time: null, step: "slots" };
    case "SELECT_TIME":
      return { ...state, time: action.time, step: "info" };
    case "SET_CLIENT":
      return { ...state, client: action.client };
    case "BACK": {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx <= 0) return state;
      // If stepping back to "professional" and only 1 employee, skip to before wizard
      return { ...state, step: STEP_ORDER[idx - 1] };
    }
    case "SUBMIT_START":
      return { ...state, submitting: true, error: "" };
    case "SUBMIT_DONE":
      return {
        ...state,
        submitting: false,
        step: "done",
        bookingRef: action.ref,
        assignedEmployeeName: action.employeeName,
      };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.msg };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  step: "professional",
  employees: [],
  employeeId: null,
  date: null,
  time: null,
  client: { name: "", phone: "", email: "", notes: "" },
  hairProfile: null,
  submitting: false,
  error: "",
  bookingRef: null,
  assignedEmployeeName: null,
  workingHours: [],
};

// ─── Step meta ────────────────────────────────────────────────────────────────

const STEP_META: Record<Exclude<Step, "done">, { title: string; subtitle: string }> = {
  professional: { title: "Escolha o profissional", subtitle: "Quem vai te atender?" },
  date:         { title: "Escolha a data",          subtitle: "Quando você quer vir?" },
  slots:        { title: "Escolha o horário",        subtitle: "Horários disponíveis" },
  info:         { title: "Seus dados",               subtitle: "Para confirmar o agendamento" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveServiceInfo(service: Service, hairLength: HairLength | undefined) {
  if (!hairLength || !service.hasPricingByLength)
    return { price: service.price, duration: service.duration };
  const p = service.pricings.find((x) => x.hairLength === hairLength);
  if (!p) return { price: service.price, duration: service.duration };
  return { price: p.price, duration: p.duration ?? service.duration };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  salon: Salon;
  service: Service;
  automationRef?: string | null;
}

export function BookingWizard({ salon, service, automationRef = null }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const topRef = useRef<HTMLDivElement>(null);

  // Load employees + working hours + hair profile
  useEffect(() => {
    const stored = localStorage.getItem(`hairProfile_${salon.slug}`);
    if (stored) {
      try { dispatch({ type: "SET_HAIR_PROFILE", profile: JSON.parse(stored) }); }
      catch { /* ignore */ }
    }

    Promise.all([
      fetch(`/api/public/${salon.slug}/employees?serviceId=${service.id}`).then((r) => r.json()),
      fetch(`/api/public/${salon.slug}`).then((r) => r.json()),
    ]).then(([emps, salonData]) => {
      dispatch({ type: "SET_EMPLOYEES", employees: emps });
      dispatch({ type: "SET_WORKING_HOURS", hours: salonData.salon?.workingHours ?? [] });

      // Auto-skip professional step when there is exactly 1 employee
      if (Array.isArray(emps) && emps.length === 1) {
        dispatch({ type: "SELECT_EMPLOYEE", id: emps[0].id });
      }
    });
  }, [salon.slug, service.id]);

  // Scroll to top on step change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step]);

  // If back-navigated to "professional" with only 1 employee, re-auto-select
  useEffect(() => {
    if (state.step === "professional" && state.employees.length === 1) {
      dispatch({ type: "SELECT_EMPLOYEE", id: state.employees[0].id });
    }
  }, [state.step, state.employees]);

  async function handleSubmit() {
    if (!state.employeeId || !state.date || !state.time) return;

    dispatch({ type: "SUBMIT_START" });

    try {
      const res = await fetch(`/api/public/${salon.slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId:     service.id,
          employeeId:    state.employeeId, // "any" or real ID
          date:          state.date,
          time:          state.time,
          hairLength:    state.hairProfile?.length ?? null,
          hairType:      state.hairProfile?.type   ?? null,
          notes:         state.client.notes || null,
          automationRef: automationRef,
          client: {
            name:  state.client.name,
            phone: state.client.phone,
            email: state.client.email || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch({ type: "SUBMIT_ERROR", msg: data.error ?? "Erro ao agendar." });
        return;
      }

      dispatch({
        type: "SUBMIT_DONE",
        ref: data.id,
        // Use the API-resolved employee name (works for both "any" and specific)
        employeeName: data.employee?.name ?? "Profissional a confirmar",
      });
    } catch {
      dispatch({ type: "SUBMIT_ERROR", msg: "Erro de rede. Tente novamente." });
    }
  }

  const { price, duration } = resolveServiceInfo(service, state.hairProfile?.length);

  // For display: "any" = show "Sem preferência", real ID = show employee name
  const selectedEmployee =
    state.employeeId === "any"
      ? { name: "Sem preferência", color: "#6B7280" }
      : state.employees.find((e) => e.id === state.employeeId);

  const stepIndex = STEP_ORDER.indexOf(state.step);

  // ─── Done screen ────────────────────────────────────────────────────────────

  if (state.step === "done") {
    const startsAt = state.date && state.time
      ? new Date(`${state.date}T${state.time}:00`)
      : null;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Agendado!</h2>
            <p className="text-gray-500 text-sm">Seu horário está confirmado</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{service.name}</p>
                {service.category && (
                  <p className="text-gray-500">{service.category.name}</p>
                )}
              </div>
            </div>
            {startsAt && (
              <div className="flex items-start gap-3">
                <CalendarCheck className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Intl.DateTimeFormat("pt-BR", {
                      weekday: "long", day: "numeric", month: "long",
                    }).format(startsAt)}
                  </p>
                  <p className="text-gray-500">às {formatTime(startsAt)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary-500 shrink-0" />
              <p className="text-gray-700">
                {duration} min · <span className="font-semibold">{formatCurrency(price)}</span>
              </p>
            </div>
            {state.assignedEmployeeName && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary-200 shrink-0" />
                <p className="text-gray-700">{state.assignedEmployeeName}</p>
              </div>
            )}
          </div>

          <Button onClick={() => router.push(`/book/${salon.slug}`)} className="w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // ─── Wizard layout ───────────────────────────────────────────────────────────

  const meta = STEP_META[state.step];

  return (
    <div className="min-h-screen bg-gray-50" ref={topRef}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() =>
              state.step === "professional"
                ? router.back()
                : dispatch({ type: "BACK" })
            }
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{salon.name}</p>
            <p className="text-xs text-gray-500">{meta.subtitle}</p>
          </div>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEP_ORDER.filter((s) => s !== "done").map((s, i) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i < stepIndex
                    ? "bg-primary-600"
                    : i === stepIndex
                    ? "bg-primary-400"
                    : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Service summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: service.category?.color ?? "#8B5CF6" }}
          >
            {service.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{service.name}</p>
            <p className="text-sm text-gray-500">
              {duration} min · {formatCurrency(price)}
              {state.hairProfile && service.hasPricingByLength && (
                <span className="ml-2 text-xs text-primary-600">
                  ({HAIR_LENGTH_LABEL[state.hairProfile.length]})
                </span>
              )}
            </p>
          </div>
          {state.hairProfile && (
            <div className="shrink-0">
              {(() => {
                const Icon = HAIR_ICONS[state.hairProfile.type][state.hairProfile.length];
                return <Icon className="h-8 w-8 text-primary-500" />;
              })()}
            </div>
          )}
        </div>

        {/* Step heading */}
        <h2 className="text-lg font-bold text-gray-900">{meta.title}</h2>

        {/* Step content */}
        {state.step === "professional" && (
          <StepEmployee
            employees={state.employees}
            selected={state.employeeId}
            onSelect={(id) => dispatch({ type: "SELECT_EMPLOYEE", id })}
          />
        )}

        {state.step === "date" && (
          <StepDate
            selected={state.date}
            onSelect={(d) => dispatch({ type: "SELECT_DATE", date: d })}
            workingHours={state.workingHours}
          />
        )}

        {state.step === "slots" && state.date && state.employeeId && (
          <StepSlots
            salonSlug={salon.slug}
            serviceId={service.id}
            employeeId={state.employeeId} // passes "any" or real ID
            date={state.date}
            hairLength={state.hairProfile?.length ?? "MEDIUM"}
            selected={state.time}
            onSelect={(t) => dispatch({ type: "SELECT_TIME", time: t })}
          />
        )}

        {state.step === "info" && (
          <>
            {/* Mini summary */}
            <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-800 space-y-1">
              {selectedEmployee && (
                <p>
                  <span className="text-primary-500">Profissional: </span>
                  {selectedEmployee.name}
                </p>
              )}
              <p>
                <span className="text-primary-500">Data: </span>
                {state.date &&
                  new Intl.DateTimeFormat("pt-BR", {
                    weekday: "short", day: "numeric", month: "short",
                  }).format(new Date(state.date + "T12:00:00"))}
                {" às "}
                <strong>{state.time}</strong>
              </p>
            </div>

            <StepInfo
              value={state.client}
              onChange={(c) => dispatch({ type: "SET_CLIENT", client: c })}
            />

            {state.error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              loading={state.submitting}
              size="lg"
              className="w-full"
              disabled={!state.client.name.trim() || !state.client.phone.trim()}
            >
              Confirmar agendamento
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
