import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BookingHome } from "@/components/booking/booking-home";

interface Props {
  params: { salonSlug: string };
}

export async function generateMetadata({ params }: Props) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { name: true },
  });
  return { title: salon ? `Agendar — ${salon.name}` : "Salão não encontrado" };
}

export default async function BookingPage({ params }: Props) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      logoUrl: true,
      workingHours: {
        orderBy: { dayOfWeek: "asc" },
        select: { dayOfWeek: true, openTime: true, closeTime: true, isOpen: true },
      },
    },
  });

  if (!salon) notFound();

  const services = await db.service.findMany({
    where: { salonId: salon.id, isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      hasPricingByLength: true,
      category: { select: { id: true, name: true, color: true } },
      pricings: { select: { hairLength: true, price: true, duration: true } },
    },
  });

  return <BookingHome salon={salon} services={services} />;
}
