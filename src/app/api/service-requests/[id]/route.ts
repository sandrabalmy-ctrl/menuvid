import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/service-requests/:id — le restaurateur marque la demande comme traitée.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const reqItem = await db.serviceRequest.findUnique({ where: { id } });
  if (!reqItem || reqItem.restaurantId !== session.rid) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await db.serviceRequest.update({ where: { id }, data: { resolved: true } });
  return NextResponse.json({ ok: true });
}
