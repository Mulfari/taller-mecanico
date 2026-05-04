import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("time_slot")
    .eq("date", date)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("GET /api/citas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const slots = (data ?? []).map((r) => r.time_slot as string);
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      date: string;
      time_slot: string;
      service_type: string;
      notes: string;
      name: string;
      phone: string;
      email: string;
      vehicle_id: string | null;
      new_vehicle: { brand: string; model: string; year: string; plate: string } | null;
    };

    if (!body.date || !body.time_slot || !body.service_type || !body.name || !body.phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if the slot is still available
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("date", body.date)
      .eq("time_slot", body.time_slot)
      .in("status", ["pending", "confirmed"]);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
    }

    // Build notes with contact info and vehicle details for guest bookings
    const contactInfo = `Contacto: ${body.name} | Tel: ${body.phone}${body.email ? ` | Email: ${body.email}` : ""}`;
    const vehicleInfo = body.new_vehicle
      ? `Vehículo: ${body.new_vehicle.brand} ${body.new_vehicle.model} ${body.new_vehicle.year}${body.new_vehicle.plate ? ` (${body.new_vehicle.plate})` : ""}`
      : null;
    const userNotes = body.notes ? `Notas: ${body.notes}` : null;
    const fullNotes = [contactInfo, vehicleInfo, userNotes].filter(Boolean).join("\n");

    const { data: inserted, error } = await supabase.from("appointments").insert({
      client_id: null,
      vehicle_id: body.vehicle_id ?? null,
      date: body.date,
      time_slot: body.time_slot,
      service_type: body.service_type,
      status: "pending",
      notes: fullNotes,
    }).select("id").single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/citas:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
