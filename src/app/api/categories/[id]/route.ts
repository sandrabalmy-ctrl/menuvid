import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function ownCategory(id: string) {
  const session = await getSession();
  if (!session?.rid) return { error: 401 as const };
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat || cat.restaurantId !== session.rid) return { error: 404 as const };
  return { session, cat };
}

// PATCH /api/categories/:id — renommer, ou déplacer (direction: "up" | "down").
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownCategory(id);
  if ("error" in owned) {
    return NextResponse.json({ error: "Non autorisé" }, { status: owned.error });
  }
  const { cat } = owned;
  const body = await req.json().catch(() => ({}));

  // Renommer (FR)
  if (typeof body.name === "string" && body.name.trim()) {
    await db.category.update({
      where: { id },
      data: { name: body.name.trim() },
    });
    return NextResponse.json({ ok: true });
  }

  // Traduction anglaise du nom
  if (typeof body.nameEn === "string") {
    const en = body.nameEn.trim();
    await db.category.update({
      where: { id },
      data: { nameEn: en.length > 0 ? en : null },
    });
    return NextResponse.json({ ok: true });
  }

  // Déplacer : on échange la position avec la catégorie voisine.
  if (body.direction === "up" || body.direction === "down") {
    const neighbor = await db.category.findFirst({
      where: {
        restaurantId: cat.restaurantId,
        position:
          body.direction === "up" ? { lt: cat.position } : { gt: cat.position },
      },
      orderBy: { position: body.direction === "up" ? "desc" : "asc" },
    });
    if (neighbor) {
      await db.$transaction([
        db.category.update({
          where: { id: cat.id },
          data: { position: neighbor.position },
        }),
        db.category.update({
          where: { id: neighbor.id },
          data: { position: cat.position },
        }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
}

// DELETE /api/categories/:id — supprime la catégorie ET ses plats (cascade).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownCategory(id);
  if ("error" in owned) {
    return NextResponse.json({ error: "Non autorisé" }, { status: owned.error });
  }
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
