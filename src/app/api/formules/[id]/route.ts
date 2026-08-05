import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildFormuleData } from "@/lib/formules";

async function owned(id: string, rid: string) {
  const f = await db.formule.findUnique({ where: { id } });
  return f && f.restaurantId === rid ? f : null;
}

// PATCH /api/formules/:id — modifier une formule (ou juste basculer available).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await owned(id, session.rid))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));

  // Bascule rapide de disponibilité (rupture) sans réécrire toute la formule.
  if (Object.keys(body).length === 1 && "available" in body) {
    await db.formule.update({
      where: { id },
      data: { available: body.available !== false },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const data = buildFormuleData(body);
    await db.formule.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}

// DELETE /api/formules/:id — supprimer une formule.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await owned(id, session.rid))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await db.formule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
