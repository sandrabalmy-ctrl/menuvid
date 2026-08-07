import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { vatBreakdown, mergeVat } from "@/lib/vat";

// GET /api/caisse/today — résumé des ventes payées du jour (clôture / ticket Z).
export async function GET() {
  const session = await getSession();
  // Chiffres du jour : réservés au propriétaire (cachés au personnel de salle).
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 401 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  // Ventes réglées et NON remboursées.
  const orders = await db.order.findMany({
    where: {
      restaurantId: session.rid,
      paid: true,
      paidAt: { gte: start },
      refundedAt: null,
    },
    select: {
      totalCents: true,
      tipCents: true,
      discountCents: true,
      paymentMethod: true,
      source: true,
      items: { select: { unitPriceCents: true, quantity: true, vatPermille: true } },
    },
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

  // Ventilation de TVA du jour (par taux).
  const vat = mergeVat(
    orders.map((o) =>
      vatBreakdown(
        o.items.map((i) => ({
          amountCents: i.unitPriceCents * i.quantity,
          vatPermille: i.vatPermille,
        })),
        o.discountCents
      )
    )
  );

  // Remboursements du jour (pour information).
  const refunded = await db.order.findMany({
    where: {
      restaurantId: session.rid,
      refundedAt: { gte: start },
    },
    select: { totalCents: true, tipCents: true },
  });
  const refundedCents = refunded.reduce((s, o) => s + o.totalCents + o.tipCents, 0);

  return NextResponse.json({
    date: start,
    count: orders.length,
    counterCount: counter,
    totalCents: total,
    cashCents: cash,
    cardCents: card,
    onlineCents: online,
    tipsCents: sum((o) => o.tipCents),
    discountCents: sum((o) => o.discountCents),
    vat,
    refundedCount: refunded.length,
    refundedCents,
  });
}
