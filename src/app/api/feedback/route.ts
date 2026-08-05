import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/feedback — le convive envoie un retour privé au restaurant
// (pour récupérer une insatisfaction avant qu'elle ne devienne publique).
export async function POST(req: NextRequest) {
  const { restaurantId, rating, message, tableNumber } = await req
    .json()
    .catch(() => ({}));

  const text = String(message ?? "").trim();
  if (!restaurantId || !text) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }
  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  const r = Number(rating);
  await db.feedback.create({
    data: {
      restaurantId,
      rating: r >= 1 && r <= 5 ? r : null,
      message: text.slice(0, 1000),
      tableNumber: tableNumber != null ? Number(tableNumber) : null,
    },
  });
  return NextResponse.json({ ok: true });
}
