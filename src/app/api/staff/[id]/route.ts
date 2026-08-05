import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE /api/staff/:id — le propriétaire retire un membre de l'équipe.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  // On ne supprime que le personnel de SON restaurant (pas les propriétaires).
  if (!user || user.restaurantId !== session.rid || user.role === "OWNER") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
