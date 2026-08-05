import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/plan";
import { getVideoProvider } from "@/lib/video";

// POST /api/video/generate — génère une vidéo à partir d'une photo de plat.
// Aujourd'hui : fournisseur "mock" (démo). Point d'intégration prêt pour un
// vrai service d'IA image→vidéo.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.rid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Verrou de palier : la vidéo n'est disponible qu'à partir du palier "Vidéo".
  const resto = await db.restaurant.findUnique({ where: { id: session.rid } });
  if (!resto || !can(resto.plan, "video")) {
    return NextResponse.json(
      { error: "La vidéo n'est pas incluse dans votre palier d'abonnement." },
      { status: 403 }
    );
  }

  const { imageUrl } = await req.json().catch(() => ({ imageUrl: "" }));
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Ajoutez d'abord une photo du plat." },
      { status: 400 }
    );
  }

  const provider = getVideoProvider();
  const job = await provider.generateFromImage({ imageUrl });
  if (job.status !== "ready" || !job.videoUrl) {
    return NextResponse.json(
      { error: job.message || "La génération a échoué." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    videoUrl: job.videoUrl,
    provider: provider.name,
    message: job.message,
  });
}
