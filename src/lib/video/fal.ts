import type { VideoProvider, VideoJob } from "./provider";

// ============================================================================
//  Fournisseur RÉEL de génération vidéo (image → vidéo) via fal.ai.
//  fal.ai = plateforme qui héberge des modèles d'IA vidéo (Kling, Luma, Wan…)
//  avec une API HTTP simple. Pour l'activer :
//    1. créer un compte sur fal.ai, obtenir une clé API
//    2. dans .env : VIDEO_PROVIDER="fal" et FAL_KEY="votre_clé"
//    3. (optionnel) FAL_MODEL="fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
//  Rien d'autre à changer dans l'app — le bouton "Générer depuis la photo"
//  produira alors de vraies vidéos de plats automatiquement.
// ============================================================================

const DEFAULT_MODEL =
  process.env.FAL_MODEL || "fal-ai/kling-video/v1.6/standard/image-to-video";

const FOOD_PROMPT =
  "Appetizing food video. Subtle, mouth-watering motion: gentle rising steam, " +
  "glistening textures, soft cinematic light, very slow push-in. The dish stays " +
  "centered and appealing. No text, no hands.";

type FalQueue = {
  status?: string;
  request_id?: string;
  status_url?: string;
  response_url?: string;
  video?: { url?: string };
};

async function falFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`fal.ai ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json() as Promise<FalQueue>;
}

export const falProvider: VideoProvider = {
  name: "fal",
  async generateFromImage({ imageUrl, prompt }): Promise<VideoJob> {
    if (!process.env.FAL_KEY) {
      return { status: "failed", message: "FAL_KEY manquant." };
    }

    // 1) On soumet la génération (file d'attente fal.ai)
    const submit = await falFetch(`https://queue.fal.run/${DEFAULT_MODEL}`, {
      method: "POST",
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: prompt || FOOD_PROMPT,
        duration: "5",
      }),
    });

    const statusUrl = submit.status_url;
    const responseUrl = submit.response_url;
    if (!statusUrl || !responseUrl) {
      return { status: "failed", message: "Réponse fal.ai inattendue." };
    }

    // 2) On attend que ce soit prêt (polling, max ~4 min)
    const deadline = Date.now() + 4 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      const st = await falFetch(statusUrl);
      if (st.status === "COMPLETED") break;
      if (st.status === "FAILED" || st.status === "ERROR") {
        return { status: "failed", message: "La génération a échoué chez fal.ai." };
      }
    }

    // 3) On récupère l'URL de la vidéo
    const result = await falFetch(responseUrl);
    const videoUrl = result.video?.url;
    if (!videoUrl) {
      return { status: "failed", message: "Vidéo non disponible (délai dépassé ?)." };
    }
    return { status: "ready", videoUrl, jobId: submit.request_id };
  },
};
