import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { StaffList } from "@/components/staff/staff-list";

export const metadata: Metadata = { title: "Profissionais" };

export default async function ProfissionaisPage() {
  const session = await requireAuth();
  const salonId = session.user.salonId;

  const staff = await db.employee.findMany({
    where: { salonId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      specialties: true,
      isActive: true,
      _count: {
        select: {
          appointments: {
            where: { startsAt: { gte: new Date() } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
        <p className="text-gray-600">Gerencie a equipe do salão</p>
      </div>
      <StaffList initialStaff={staff} />
    </div>
  );
}
