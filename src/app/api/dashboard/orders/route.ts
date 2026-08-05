import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/dashboard/orders — commandes du restaurant connecté (temps réel).
export async function GET() {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: { restaurantId: session.rid },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true, table: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      tipCents: o.tipCents,
      paid: o.paid,
      tableNumber: o.table?.number ?? null,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        optionsText: i.optionsText,
        note: i.note,
      })),
    })),
  });
}
