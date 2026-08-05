import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildFormuleData } from "@/lib/formules";

// POST /api/formules — créer une formule (restaurateur/salle connecté).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const data = buildFormuleData(body);
    const last = await db.formule.findFirst({
      where: { restaurantId: session.rid },
      orderBy: { position: "desc" },
    });
    const formule = await db.formule.create({
      data: {
        restaurantId: session.rid,
        ...data,
        position: (last?.position ?? -1) + 1,
      },
    });
    return NextResponse.json({ id: formule.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 }
    );
  }
}
