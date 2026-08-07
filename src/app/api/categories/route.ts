import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/categories { name } — crée une catégorie (en fin de liste).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { name } = await req.json().catch(() => ({ name: "" }));
  const clean = String(name ?? "").trim();
  if (!clean) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  const last = await db.category.findFirst({
    where: { restaurantId: session.rid },
    orderBy: { position: "desc" },
  });
  const cat = await db.category.create({
    data: {
      restaurantId: session.rid,
      name: clean,
      position: (last?.position ?? -1) + 1,
    },
  });
  return NextResponse.json({ id: cat.id });
}
