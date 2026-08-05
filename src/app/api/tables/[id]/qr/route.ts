import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/tables/:id/qr — renvoie le QR code (PNG) qui pointe vers le menu
// de cette table : {origine}/r/{slug}/t/{numéro}. Le scan pré-remplit la table.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;

  const table = await db.diningTable.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  if (!table || table.restaurantId !== session.rid) {
    return NextResponse.json({ error: "Table introuvable" }, { status: 404 });
  }

  const origin = req.nextUrl.origin;
  const url = `${origin}/r/${table.restaurant.slug}/t/${table.number}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 600,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
