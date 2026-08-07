import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/caisse/refund/[id] — annuler / rembourser une vente déjà encaissée.
// Réservé au propriétaire (geste sensible).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 200)
      : null;

  const order = await db.order.findFirst({
    where: { id, restaurantId: session.rid },
  });
  if (!order) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }
  if (!order.paid) {
    return NextResponse.json({ error: "Vente non encaissée" }, { status: 409 });
  }
  if (order.refundedAt) {
    return NextResponse.json({ error: "Déjà remboursée" }, { status: 409 });
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: { refundedAt: new Date(), refundReason: reason, status: "CANCELLED" },
  });

  return NextResponse.json({
    orderId: updated.id,
    refundedAt: updated.refundedAt,
    refundedCents: order.totalCents + order.tipCents,
  });
}
