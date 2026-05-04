import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toICSDate(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: appt }, { data: shopConfig }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `id, date, time_slot, service_type, status, notes,
         vehicle:vehicles!appointments_vehicle_id_fkey(brand, model, year, plate)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("shop_config")
      .select("name, phone, address")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const shopName = shopConfig?.name ?? "TallerPro";
  const vehicle = Array.isArray(appt.vehicle) ? appt.vehicle[0] ?? null : appt.vehicle;
  const vehicleLabel = vehicle
    ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.plate ? ` (${vehicle.plate})` : ""}`
    : "";

  const dtStart = toICSDate(appt.date, appt.time_slot);
  const endTime = addMinutes(appt.time_slot, 60);
  const dtEnd = toICSDate(appt.date, endTime);

  const summary = `${appt.service_type} — ${shopName}`;
  const descParts = [`Servicio: ${appt.service_type}`];
  if (vehicleLabel) descParts.push(`Vehículo: ${vehicleLabel}`);
  if (appt.notes) descParts.push(`Notas: ${appt.notes}`);
  if (shopConfig?.phone) descParts.push(`Tel: ${shopConfig.phone}`);
  const description = descParts.join("\\n");
  const location = shopConfig?.address ?? "";

  const uid = `cita-${appt.id}@tallerpro`;
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TallerPro//Citas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Recordatorio: ${escapeICS(appt.service_type)} en ${escapeICS(shopName)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const filename = `cita-${appt.id.slice(0, 8)}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
