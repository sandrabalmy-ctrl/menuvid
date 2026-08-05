import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TYPES = ["CALL_WAITER", "BILL"];

// POST /api/service-request — le convive appelle le serveur / demande l'addition.
// Public (comme les commandes). Dédoublonne : une demande non résolue du même
// type pour la même table n'est pas recréée.
export async function POST(req: NextRequest) {
  const { restaurantId, tableNumber, type } = await req
    .json()
    .catch(() => ({}));

  if (!restaurantId || !TYPES.includes(type)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const table = tableNumber != null ? Number(tableNumber) : null;
  const existing = await db.serviceRequest.findFirst({
    where: { restaurantId, tableNumber: table, type, resolved: false },
  });
  if (existing) return NextResponse.json({ ok: true, deduped: true });

  await db.serviceRequest.create({
    data: { restaurantId, tableNumber: table, type },
  });
  return NextResponse.json({ ok: true });
}
