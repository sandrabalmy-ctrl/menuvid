import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/caisse/open-orders — commandes passées à table (QR) restant à encaisser.
// Sert à régler à la caisse une commande venue d'une table.
export async function GET() {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: {
      restaurantId: session.rid,
      paid: false,
      source: "QR",
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "asc" },
    include: { items: true, table: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      tableNumber: o.table?.number ?? null,
      tableLabel: o.table?.label ?? null,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        optionsText: i.optionsText,
      })),
    })),
  });
}
