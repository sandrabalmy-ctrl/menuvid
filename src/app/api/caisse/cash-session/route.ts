import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Espèces attendues dans le tiroir depuis l'ouverture :
// fond d'ouverture + ventes en espèces (non remboursées) encaissées depuis.
async function expectedCash(rid: string, openingCents: number, since: Date) {
  const cashOrders = await db.order.findMany({
    where: {
      restaurantId: rid,
      paid: true,
      paymentMethod: "CASH",
      refundedAt: null,
      paidAt: { gte: since },
    },
    select: { totalCents: true, tipCents: true },
  });
  const cashSales = cashOrders.reduce((s, o) => s + o.totalCents + o.tipCents, 0);
  return { expected: openingCents + cashSales, cashSales };
}

// GET — session de caisse en cours (ou null), avec l'attendu calculé en direct.
export async function GET() {
  const session = await getSession();
  // Fond de caisse (laisse voir les espèces attendues) : réservé au propriétaire.
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 401 });
  }

  const open = await db.cashSession.findFirst({
    where: { restaurantId: session.rid, closedAt: null },
    orderBy: { openedAt: "desc" },
  });
  if (!open) return NextResponse.json({ session: null });

  const { expected, cashSales } = await expectedCash(
    session.rid,
    open.openingCents,
    open.openedAt
  );
  return NextResponse.json({
    session: {
      id: open.id,
      openingCents: open.openingCents,
      openedAt: open.openedAt,
      cashSalesCents: cashSales,
      expectedCents: expected,
    },
  });
}

// POST — ouvrir ({action:"open", openingCents}) ou clôturer ({action:"close", countedCents}).
export async function POST(req: NextRequest) {
  const session = await getSession();
  // Fond de caisse (laisse voir les espèces attendues) : réservé au propriétaire.
  if (session?.role !== "OWNER" || !session.rid) {
    return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const rid = session.rid;

  if (body.action === "open") {
    const existing = await db.cashSession.findFirst({
      where: { restaurantId: rid, closedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "Caisse déjà ouverte" }, { status: 409 });
    }
    const openingCents = Math.max(0, Math.round(Number(body.openingCents) || 0));
    const created = await db.cashSession.create({
      data: { restaurantId: rid, openingCents },
    });
    return NextResponse.json({ session: { id: created.id, openingCents } });
  }

  if (body.action === "close") {
    const open = await db.cashSession.findFirst({
      where: { restaurantId: rid, closedAt: null },
      orderBy: { openedAt: "desc" },
    });
    if (!open) {
      return NextResponse.json({ error: "Aucune caisse ouverte" }, { status: 409 });
    }
    const countedCents = Math.max(0, Math.round(Number(body.countedCents) || 0));
    const { expected } = await expectedCash(rid, open.openingCents, open.openedAt);
    const diff = countedCents - expected;
    const closed = await db.cashSession.update({
      where: { id: open.id },
      data: {
        closedAt: new Date(),
        countedCents,
        expectedCents: expected,
        diffCents: diff,
      },
    });
    return NextResponse.json({
      closed: {
        openingCents: open.openingCents,
        expectedCents: expected,
        countedCents,
        diffCents: diff,
        closedAt: closed.closedAt,
      },
    });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
