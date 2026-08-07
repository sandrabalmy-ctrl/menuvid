import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/caisse/today — résumé des ventes payées du jour (clôture / ticket Z).
export async function GET() {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: { restaurantId: session.rid, paid: true, paidAt: { gte: start } },
    select: { totalCents: true, tipCents: true, paymentMethod: true, source: true },
  });

  const sum = (f: (o: (typeof orders)[number]) => number) =>
    orders.reduce((s, o) => s + f(o), 0);

  const total = sum((o) => o.totalCents + o.tipCents);
  const cash = sum((o) => (o.paymentMethod === "CASH" ? o.totalCents + o.tipCents : 0));
  const card = sum((o) => (o.paymentMethod === "CARD" ? o.totalCents + o.tipCents : 0));
  const online = sum((o) =>
    o.paymentMethod === "ONLINE" || (!o.paymentMethod && o.source === "QR")
      ? o.totalCents + o.tipCents
      : 0
  );
  const counter = orders.filter((o) => o.source === "COUNTER").length;

  return NextResponse.json({
    date: start,
    count: orders.length,
    counterCount: counter,
    totalCents: total,
    cashCents: cash,
    cardCents: card,
    onlineCents: online,
  });
}
