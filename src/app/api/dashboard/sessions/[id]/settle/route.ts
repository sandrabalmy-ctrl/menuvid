import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/dashboard/sessions/:id/settle — le restaurateur clôture l'addition
// (encaissée sur place en espèces/CB par exemple).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const ts = await db.tableSession.findUnique({ where: { id } });
  if (!ts || ts.restaurantId !== session.rid) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await db.tableSession.update({
    where: { id },
    data: { status: "SETTLED", settledAt: new Date() },
  });
  await db.order.updateMany({
    where: { sessionId: id },
    data: { paid: true, paidAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
