import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuoteItemRow } from "@/lib/supabase/queries/quotes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      client_id: string;
      vehicle_id: string;
      items: QuoteItemRow[];
      total: number;
      valid_until: string | null;
    };

    if (!body.client_id || !body.vehicle_id) {
      return NextResponse.json({ error: "Cliente y vehículo son requeridos" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Se requiere al menos un ítem" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        client_id: body.client_id,
        vehicle_id: body.vehicle_id,
        items: body.items,
        total: body.total,
        status: "draft",
        valid_until: body.valid_until || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/quotes:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
