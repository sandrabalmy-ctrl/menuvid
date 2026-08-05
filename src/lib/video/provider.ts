// ============================================================================
//  Point d'intégration VIDÉO — modulaire.
//  Objectif produit : "une photo de plat → une vidéo courte automatiquement".
//  On définit ici un contrat générique. On pourra brancher n'importe quel
//  fournisseur d'IA vidéo (image→vidéo) plus tard SANS toucher au reste de l'app :
//  il suffira d'écrire un nouveau fichier qui respecte cette interface.
// ============================================================================

export type VideoJob = {
  status: "pending" | "ready" | "failed";
  videoUrl?: string;
  jobId?: string;
  message?: string;
};

export interface VideoProvider {
  name: string;
  /** Génère une vidéo courte (9:16) à partir de l'URL d'une photo de plat. */
  generateFromImage(input: {
    imageUrl: string;
    prompt?: string;
  }): Promise<VideoJob>;
}
