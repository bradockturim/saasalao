import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BookingWizard } from "@/components/booking/booking-wizard";

interface Props {
  params:       { salonSlug: string };
  searchParams: { serviceId?: string; ref?: string };
}

export default async function BookPage({ params, searchParams }: Props) {
  const salon = await db.salon.findUnique({
    where: { slug: params.salonSlug, isActive: true },
    select: { id: true, name: true, slug: true },
  });
  if (!salon) notFound();

  if (!searchParams.serviceId) notFound();

  const service = await db.service.findFirst({
    where: { id: searchParams.serviceId, salonId: salon.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      hasPricingByLength: true,
      requiresVirginHairCheck: true,
      category: { select: { name: true, color: true } },
      pricings: { select: { hairLength: true, price: true, duration: true } },
    },
  });
  if (!service) notFound();

  return (
    <BookingWizard
      salon={salon}
      service={service}
      automationRef={searchParams.ref ?? null}
    />
  );
}
