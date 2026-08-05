// ============================================================================
//  Verrou "palier d'abonnement" — centralisé ici.
//  Toute la logique produit passe par ces fonctions : impossible qu'un
//  restaurant "Essentiel" uploade une vidéo, ou qu'un palier sans "Commande"
//  affiche le panier. Un seul endroit à modifier pour faire évoluer l'offre.
// ============================================================================

export type Plan = "ESSENTIAL" | "VIDEO" | "ORDER";

export const PLANS: Record<
  Plan,
  { label: string; priceCents: number; features: Feature[] }
> = {
  ESSENTIAL: {
    label: "Essentiel",
    priceCents: 2900,
    features: ["menu", "photos", "qr"],
  },
  VIDEO: {
    label: "Vidéo",
    priceCents: 3900,
    features: ["menu", "photos", "qr", "video"],
  },
  ORDER: {
    label: "Commande",
    priceCents: 5700, // 39€ + option commande ~18€
    features: ["menu", "photos", "qr", "video", "ordering", "analytics"],
  },
};

export type Feature =
  | "menu"
  | "photos"
  | "qr"
  | "video"
  | "ordering"
  | "analytics";

/** Le palier donne-t-il accès à cette fonctionnalité ? */
export function can(plan: string, feature: Feature): boolean {
  const p = PLANS[plan as Plan];
  return p ? p.features.includes(feature) : false;
}
