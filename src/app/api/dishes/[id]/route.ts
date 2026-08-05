import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildDishData } from "@/lib/dish-input";

// Vérifie que le plat existe ET appartient au restaurant connecté.
async function ownDish(id: string) {
  const session = await getSession();
  if (!session?.rid) return { error: 401 as const };
  const dish = await db.dish.findUnique({ where: { id } });
  if (!dish || dish.restaurantId !== session.rid) return { error: 404 as const };
  return { session, dish };
}

// PATCH /api/dishes/:id — modifier un plat (ou juste basculer sa disponibilité).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownDish(id);
  if ("error" in owned) {
    return NextResponse.json({ error: "Non autorisé" }, { status: owned.error });
  }

  const body = await req.json().catch(() => ({}));

  // Cas simple : bascule rapide de disponibilité (rupture de stock).
  if (Object.keys(body).length === 1 && typeof body.available === "boolean") {
    await db.dish.update({ where: { id }, data: { available: body.available } });
    return NextResponse.json({ ok: true });
  }

  try {
    const data = await buildDishData(owned.dish.restaurantId, body);
    await db.dish.update({ where: { id }, data });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}

// DELETE /api/dishes/:id — supprimer un plat.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownDish(id);
  if ("error" in owned) {
    return NextResponse.json({ error: "Non autorisé" }, { status: owned.error });
  }
  await db.dish.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
