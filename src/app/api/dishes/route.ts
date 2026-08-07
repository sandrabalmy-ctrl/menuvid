import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildDishData } from "@/lib/dish-input";

// POST /api/dishes — créer un plat (restaurateur connecté).
export async function POST(req: NextRequest) {
  const session = await getSession();
  // Gestion du menu : propriétaire ou salle (pas la cuisine).
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    const data = await buildDishData(session.rid, body);
    const last = await db.dish.findFirst({
      where: { restaurantId: session.rid, categoryId: data.categoryId },
      orderBy: { position: "desc" },
    });
    const dish = await db.dish.create({
      data: {
        restaurantId: session.rid,
        ...data,
        position: (last?.position ?? -1) + 1,
      },
    });
    return NextResponse.json({ id: dish.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}
