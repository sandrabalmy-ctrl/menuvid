import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/dashboard/sessions — additions de table ouvertes du restaurant.
export async function GET() {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const sessions = await db.tableSession.findMany({
    where: { restaurantId: session.rid, status: "OPEN" },
    include: { orders: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    sessions: sessions
      .filter((s) => s.orders.length > 0)
      .map((s) => {
        const subtotal = s.orders.reduce((a, o) => a + o.totalCents, 0);
        const tip = s.orders.reduce((a, o) => a + o.tipCents, 0);
        const total = subtotal + tip;
        return {
          id: s.id,
          tableNumber: s.tableNumber,
          totalCents: total,
          paidCents: s.paidCents,
          remainingCents: Math.max(0, total - s.paidCents),
          orderCount: s.orders.length,
        };
      }),
  });
}
