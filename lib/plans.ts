export type PlanKey = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export const PLAN_LIMITS: Record<PlanKey, { staff: number; appointmentsPerMonth: number }> = {
  FREE:         { staff: 1,        appointmentsPerMonth: 30         },
  STARTER:      { staff: 2,        appointmentsPerMonth: 150        },
  PROFESSIONAL: { staff: 5,        appointmentsPerMonth: 400        },
  ENTERPRISE:   { staff: Infinity, appointmentsPerMonth: Infinity   },
};

export const PLAN_NAMES: Record<PlanKey, string> = {
  FREE:         "Gratuito",
  STARTER:      "Essencial",
  PROFESSIONAL: "Pro",
  ENTERPRISE:   "Premium",
};

export const PLAN_FEATURES: Record<PlanKey, { automations: boolean }> = {
  FREE:         { automations: false },
  STARTER:      { automations: false },
  PROFESSIONAL: { automations: true  },
  ENTERPRISE:   { automations: true  },
};
