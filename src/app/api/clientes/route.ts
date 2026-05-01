import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, phone } = body as {
      full_name: string;
      email: string;
      phone: string | null;
    };

    if (!full_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Ya existe un cliente con ese correo electrónico" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        role: "client",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/clientes:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
