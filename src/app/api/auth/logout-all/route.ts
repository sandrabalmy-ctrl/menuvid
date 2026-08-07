import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, destroySession } from "@/lib/auth";

// POST /api/auth/logout-all — déconnecte l'utilisateur de TOUS ses appareils.
// Incrémente l'epoch de session : tous les jetons déjà émis deviennent invalides.
export async function POST() {
  const session = await getSession();
  if (!session?.uid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.uid },
    data: { sessionEpoch: { increment: 1 } },
  });
  await destroySession();

  return NextResponse.json({ ok: true });
}
