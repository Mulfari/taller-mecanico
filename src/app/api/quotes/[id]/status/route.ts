import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/types/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json() as { status: QuoteStatus };

    const validStatuses: QuoteStatus[] = ["draft", "sent", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/quotes/[id]/status:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
