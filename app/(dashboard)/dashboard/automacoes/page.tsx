import type { Metadata } from "next";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { AutomationsList } from "@/components/automations/automations-list";

export const metadata: Metadata = { title: "Automações" };

export default async function AutomacoesPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const salonId = session.user.salonId;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [rules, services, sentStats, convStats] = await Promise.all([
    db.automationRule.findMany({
      where:   { salonId },
      include: {
        service: {
          select: {
            id: true, name: true,
            category: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    db.service.findMany({
      where:   { salonId, isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    db.automationQueue.groupBy({
      by:    ["ruleId"],
      where: { salonId, status: "SENT", sentAt: { gte: start, lt: end } },
      _count: { ruleId: true },
    }),

    db.automationQueue.groupBy({
      by:    ["ruleId"],
      where: { salonId, convertedAt: { gte: start, lt: end } },
      _count: { ruleId: true },
    }),
  ]);

  const sentMap = Object.fromEntries(sentStats.map((s) => [s.ruleId, s._count.ruleId]));
  const convMap = Object.fromEntries(convStats.map((s) => [s.ruleId, s._count.ruleId]));

  const rulesWithStats = rules.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    stats: {
      sentThisMonth:      sentMap[r.id] ?? 0,
      convertedThisMonth: convMap[r.id] ?? 0,
    },
  }));

  const totalSent      = Object.values(sentMap).reduce((a, b) => a + b, 0);
  const totalConverted = Object.values(convMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automações de Recompra</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Envie lembretes automáticos via WhatsApp após atendimentos concluídos
        </p>
      </div>

      <AutomationsList
        initialRules={rulesWithStats}
        services={services}
        globalStats={{ totalSent, totalConverted }}
      />
    </div>
  );
}
