import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TYPES = ["VIDEO_VIEW", "ADD_TO_CART", "ORDER"];

// POST /api/events — enregistre un événement analytics (vue vidéo, ajout panier).
// Appelé en "fire-and-forget" par le téléphone du convive (navigator.sendBeacon).
export async function POST(req: NextRequest) {
  let body: { restaurantId?: string; dishId?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { restaurantId, dishId, type } = body;
  if (!restaurantId || !type || !TYPES.includes(type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Vérifie que le plat (s'il est fourni) appartient bien à ce restaurant.
  let safeDishId: string | null = null;
  if (dishId) {
    const dish = await db.dish.findFirst({
      where: { id: dishId, restaurantId },
      select: { id: true },
    });
    safeDishId = dish?.id ?? null;
  }

  await db.analyticsEvent.create({
    data: { restaurantId, dishId: safeDishId, type },
  });
  return NextResponse.json({ ok: true });
}
