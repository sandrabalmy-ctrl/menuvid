import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/dashboard/eta — temps d'attente estimé actuel (salle/cuisine/patron).
export async function GET() {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const r = await db.restaurant.findUnique({
    where: { id: session.rid },
    select: { prepEtaMinutes: true },
  });
  return NextResponse.json({ minutes: r?.prepEtaMinutes ?? 20 });
}

// POST /api/dashboard/eta — ajuster le temps d'attente (rush, coup de feu…).
// Accessible à toute l'équipe connectée : c'est la cuisine qui sait le mieux.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { minutes } = await req.json().catch(() => ({}));
  const m = Math.max(0, Math.min(240, Math.round(Number(minutes) || 0)));
  await db.restaurant.update({
    where: { id: session.rid },
    data: { prepEtaMinutes: m },
  });
  return NextResponse.json({ ok: true, minutes: m });
}
