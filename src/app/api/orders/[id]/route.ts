import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sessionSummary } from "@/lib/session";

// GET /api/orders/:id — suivi de commande en temps réel (le convive interroge
// régulièrement cette route pour voir passer le statut reçue → prête).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, table: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  // Addition de la table (toutes les tournées de la session)
  const session = order.sessionId
    ? await sessionSummary(order.sessionId)
    : null;
  return NextResponse.json({
    id: order.id,
    status: order.status,
    totalCents: order.totalCents,
    tipCents: order.tipCents,
    paid: order.paid,
    etaMinutes: order.etaMinutes,
    session,
    tableNumber: order.table?.number ?? null,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      optionsText: i.optionsText,
      note: i.note,
    })),
  });
}

const ALLOWED = ["RECEIVED", "PREPARING", "READY", "SERVED", "CANCELLED"];

// PATCH /api/orders/:id — la cuisine / le back-office change le statut.
// (Sera protégé par l'authentification restaurateur à l'étape back-office.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Réservé au restaurateur connecté, et uniquement sur SES commandes (multi-tenant).
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const existing = await db.order.findUnique({ where: { id } });
  if (!existing || existing.restaurantId !== session.rid) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { status } = await req.json().catch(() => ({ status: undefined }));
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }
  const order = await db.order.update({ where: { id }, data: { status } });
  return NextResponse.json({ id: order.id, status: order.status });
}
