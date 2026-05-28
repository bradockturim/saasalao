export interface SlotAppointment {
  startsAt: Date | string;
  endsAt: Date | string;
  /** Professional active minutes. If set, professional is only blocked for activeTime minutes
   *  from startsAt (e.g. highlights: professional applies for 50min, client waits the rest). */
  activeTime?: number | null;
}

export interface SlotParams {
  date: Date;
  openTime: string;    // "HH:MM"
  closeTime: string;   // "HH:MM"
  durationMinutes: number;
  appointments: SlotAppointment[];
  intervalMinutes?: number;
}

/** Returns the end of the professional's active window for an appointment. */
function professionalEndsAt(apt: SlotAppointment): Date {
  const start = new Date(apt.startsAt);
  if (apt.activeTime) {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + apt.activeTime);
    return end;
  }
  return new Date(apt.endsAt);
}

export function generateSlots({
  date,
  openTime,
  closeTime,
  durationMinutes,
  appointments,
  intervalMinutes = 30,
}: SlotParams): string[] {
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const slots: string[] = [];

  for (let start = openTotal; start + durationMinutes <= closeTotal; start += intervalMinutes) {
    const slotStart = new Date(date);
    slotStart.setHours(Math.floor(start / 60), start % 60, 0, 0);

    if (isToday && slotStart <= now) continue;

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    const busy = appointments.some((apt) => {
      const s = new Date(apt.startsAt);
      const e = professionalEndsAt(apt);
      return slotStart < e && slotEnd > s;
    });

    if (!busy) {
      const h = Math.floor(start / 60).toString().padStart(2, "0");
      const m = (start % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}
