import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/tables — ajoute une table (numéro suivant automatique).
export async function POST() {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const last = await db.diningTable.findFirst({
    where: { restaurantId: session.rid },
    orderBy: { number: "desc" },
  });
  const table = await db.diningTable.create({
    data: { restaurantId: session.rid, number: (last?.number ?? 0) + 1 },
  });
  return NextResponse.json({ id: table.id, number: table.number });
}
