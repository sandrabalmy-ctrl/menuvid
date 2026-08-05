import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUpload, extForType } from "@/lib/storage";

const MAX_IMAGE = 10 * 1024 * 1024; // 10 Mo
const MAX_VIDEO = 60 * 1024 * 1024; // 60 Mo

// POST /api/upload (multipart, champ "file") — envoie une photo ou une vidéo.
// Renvoie { url, kind } ; l'URL est ensuite enregistrée sur le plat.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Format non supporté (image ou vidéo uniquement)." },
      { status: 400 }
    );
  }
  if (isImage && file.size > MAX_IMAGE) {
    return NextResponse.json(
      { error: "Image trop lourde (10 Mo max)." },
      { status: 400 }
    );
  }
  if (isVideo && file.size > MAX_VIDEO) {
    return NextResponse.json(
      { error: "Vidéo trop lourde (60 Mo max)." },
      { status: 400 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const ext = extForType(file.type, file.name);
  const url = await saveUpload({ data, ext, restaurantId: session.rid });

  return NextResponse.json({ url, kind: isImage ? "image" : "video" });
}
