import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveUpload, extForType } from "@/lib/storage";

const MAX = 10 * 1024 * 1024; // 10 Mo

// POST /api/review-proof (multipart: file + restaurantId) — le convive envoie
// la capture d'écran de son avis Google pour débloquer la roue. Public.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const restaurantId = String(form?.get("restaurantId") ?? "");

  if (!(file instanceof File) || !restaurantId) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const resto = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!resto || !resto.reviewGiftEnabled) {
    return NextResponse.json({ error: "Indisponible" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: "Image trop lourde (10 Mo max)." }, { status: 400 });
  }
  // Extension issue de la liste blanche uniquement (jamais du nom client).
  const ext = extForType(file.type);
  if (!ext || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Une image est attendue (JPEG, PNG, WebP, GIF)." }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload({ data, ext, restaurantId });
  await db.reviewProof.create({ data: { restaurantId, imageUrl: url } });

  return NextResponse.json({ ok: true, url });
}
