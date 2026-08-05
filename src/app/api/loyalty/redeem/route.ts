import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";

// POST /api/loyalty/redeem { restaurantId } — utilise la récompense.
// Décompte le seuil des points (le personnel valide visuellement l'écran).
export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const { restaurantId } = await req.json().catch(() => ({}));
  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto || !resto.loyaltyEnabled) {
    return NextResponse.json({ error: "Fidélité indisponible" }, { status: 400 });
  }

  const membership = await db.loyaltyMembership.findUnique({
    where: {
      customerId_restaurantId: { customerId: session.cid, restaurantId },
    },
  });
  if (!membership || membership.points < resto.loyaltyThreshold) {
    return NextResponse.json(
      { error: "Pas assez de points." },
      { status: 400 }
    );
  }

  const updated = await db.loyaltyMembership.update({
    where: { id: membership.id },
    data: { points: membership.points - resto.loyaltyThreshold },
  });
  return NextResponse.json({ ok: true, points: updated.points });
}
