import type { VideoProvider } from "./provider";

// Fournisseur de DÉMONSTRATION. Ne génère pas réellement de vidéo :
// il renvoie une des vraies vidéos IA déjà produites (burger/pizza/tiramisu),
// pour que tout le flux (bouton → génération → vidéo attachée) soit testable
// et VISUELLEMENT crédible dès maintenant, sans clé API.
// Passer VIDEO_PROVIDER="fal" + FAL_KEY pour la vraie génération à la demande.
const SAMPLE_CLIPS = [
  "/videos/burger.mp4",
  "/videos/pizza.mp4",
  "/videos/tiramisu.mp4",
];

export const mockProvider: VideoProvider = {
  name: "mock",
  async generateFromImage({ imageUrl }) {
    // Simule un court délai de "traitement".
    await new Promise((r) => setTimeout(r, 1200));
    // Choix déterministe d'un clip d'exemple selon la photo source.
    const idx =
      Math.abs(
        [...imageUrl].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)
      ) % SAMPLE_CLIPS.length;
    return {
      status: "ready",
      videoUrl: SAMPLE_CLIPS[idx],
      message:
        "Vidéo de démonstration (le vrai générateur IA sera branché ici plus tard).",
    };
  },
};
