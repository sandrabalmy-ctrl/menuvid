import type { VideoProvider, VideoJob } from "./provider";
import { mockProvider } from "./mock";
import { falProvider } from "./fal";

// Sélection du fournisseur vidéo actif via variable d'environnement.
//   VIDEO_PROVIDER="mock" (défaut) : démo, renvoie un clip d'exemple.
//   VIDEO_PROVIDER="fal"           : vraie génération IA image→vidéo (clé FAL_KEY).
// Pour ajouter un autre service (Runway, Luma…), créer ./<nom>.ts respectant
// l'interface VideoProvider et l'enregistrer ici. Le reste de l'app ne change pas.
const PROVIDERS: Record<string, VideoProvider> = {
  mock: mockProvider,
  fal: falProvider,
};

export function getVideoProvider(): VideoProvider {
  const key = process.env.VIDEO_PROVIDER || "mock";
  return PROVIDERS[key] ?? mockProvider;
}

export type { VideoJob };
