import { db } from "@/lib/db";

// Trouve la session de table ouverte, ou en crée une. Les commandes (tournées)
// d'une même table s'y rattachent pour former une addition unique.
export async function getOrCreateOpenSession(
  restaurantId: string,
  tableNumber: number | null
) {
  if (tableNumber == null) return null; // à emporter : pas de regroupement
  const existing = await db.tableSession.findFirst({
    where: { restaurantId, tableNumber, status: "OPEN" },
  });
  if (existing) return existing;
  return db.tableSession.create({ data: { restaurantId, tableNumber } });
}

// Ajoute un paiement à une session et la clôture si le total est couvert.
export async function addSessionPayment(sessionId: string, amountCents: number) {
  await db.tableSession.update({
    where: { id: sessionId },
    data: { paidCents: { increment: Math.max(0, Math.round(amountCents)) } },
  });
  const s = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });
  if (!s) return;
  const total = s.orders.reduce((a, o) => a + o.totalCents + o.tipCents, 0);
  if (total > 0 && s.paidCents >= total) {
    await db.tableSession.update({
      where: { id: sessionId },
      data: { status: "SETTLED", settledAt: new Date() },
    });
    await db.order.updateMany({
      where: { sessionId },
      data: { paid: true, paidAt: new Date() },
    });
  }
}

export type SessionSummary = {
  id: string;
  tableNumber: number | null;
  subtotalCents: number;
  tipCents: number;
  totalCents: number; // sous-total + pourboires
  paidCents: number;
  remainingCents: number;
  orderCount: number;
  settled: boolean;
};

// Récapitulatif chiffré d'une session (l'addition de la table).
export async function sessionSummary(
  sessionId: string
): Promise<SessionSummary | null> {
  const s = await db.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });
  if (!s) return null;
  const subtotal = s.orders.reduce((a, o) => a + o.totalCents, 0);
  const tip = s.orders.reduce((a, o) => a + o.tipCents, 0);
  const total = subtotal + tip;
  return {
    id: s.id,
    tableNumber: s.tableNumber,
    subtotalCents: subtotal,
    tipCents: tip,
    totalCents: total,
    paidCents: s.paidCents,
    remainingCents: Math.max(0, total - s.paidCents),
    orderCount: s.orders.length,
    settled: s.status === "SETTLED",
  };
}
