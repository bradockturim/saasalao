import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";
import { MyAppointments } from "@/components/booking/my-appointments";

export async function generateMetadata({ params }: { params: { salonSlug: string } }) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { name: true },
  });
  return { title: salon ? `Meus Agendamentos — ${salon.name}` : "Salão não encontrado" };
}

export default async function MinhaContaPage({
  params,
}: {
  params: { salonSlug: string };
}) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { name: true, slug: true },
  });
  if (!salon) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/book/${params.salonSlug}`}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <p className="font-bold text-gray-900 text-sm truncate">{salon.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <MyAppointments salonSlug={params.salonSlug} />
      </div>
    </div>
  );
}
