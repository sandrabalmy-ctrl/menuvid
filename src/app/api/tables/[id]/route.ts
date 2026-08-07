import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE /api/tables/:id — supprime une table.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.rid || session.role === "KITCHEN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const table = await db.diningTable.findUnique({ where: { id } });
  if (!table || table.restaurantId !== session.rid) {
    return NextResponse.json({ error: "Table introuvable" }, { status: 404 });
  }
  await db.diningTable.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
