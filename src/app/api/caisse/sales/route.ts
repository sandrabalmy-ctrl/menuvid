import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/caisse/sales — ventes encaissées du jour (pour l'historique / remboursement).
export async function GET() {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: { restaurantId: session.rid, paid: true, paidAt: { gte: start } },
    orderBy: { paidAt: "desc" },
    include: { items: true, table: true },
  });

  return NextResponse.json({
    sales: orders.map((o) => ({
      id: o.id,
      totalCents: o.totalCents,
      tipCents: o.tipCents,
      discountCents: o.discountCents,
      paymentMethod: o.paymentMethod,
      source: o.source,
      tableNumber: o.table?.number ?? null,
      paidAt: o.paidAt,
      refunded: o.refundedAt != null,
      items: o.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        optionsText: i.optionsText,
        vatPermille: i.vatPermille,
      })),
    })),
  });
}
