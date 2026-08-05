import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyPlan, isPlan } from "@/lib/billing";

// PATCH /api/admin/restaurants/:id — change le palier ou le statut (super-admin).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const resto = await db.restaurant.findUnique({ where: { id } });
  if (!resto) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  if (isPlan(body.plan)) {
    await applyPlan(id, body.plan); // met à jour restaurant + abonnement
  }
  if (
    typeof body.status === "string" &&
    ["ACTIVE", "SUSPENDED", "TRIAL"].includes(body.status)
  ) {
    await db.restaurant.update({ where: { id }, data: { status: body.status } });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/restaurants/:id — supprime un restaurant client.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (session?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  await db.restaurant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
