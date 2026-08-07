// ============================================================================
//  Verrou "palier d'abonnement" — centralisé ici.
//  Toute la logique produit passe par ces fonctions : impossible qu'un
//  restaurant "Essentiel" uploade une vidéo, ou qu'un palier sans "Commande"
//  affiche le panier. Un seul endroit à modifier pour faire évoluer l'offre.
// ============================================================================

export type Plan = "ESSENTIAL" | "VIDEO" | "ORDER";

// priceCents = prix par défaut (euros, en centimes).
// pricesByCurrency = prix propre à une devise (en "centimes" de cette devise ;
// pour le FCFA/XOF, 1 FCFA = 100 → 15 000 FCFA = 1 500 000).
// ⚠️ Les montants FCFA ci-dessous sont des VALEURS PAR DÉFAUT à ajuster.
export const PLANS: Record<
  Plan,
  {
    label: string;
    priceCents: number;
    pricesByCurrency?: Record<string, number>;
    features: Feature[];
  }
> = {
  ESSENTIAL: {
    label: "Essentiel",
    priceCents: 2900,
    pricesByCurrency: { XOF: 1500000 }, // 15 000 FCFA
    features: ["menu", "photos", "qr"],
  },
  VIDEO: {
    label: "Vidéo",
    priceCents: 3900,
    pricesByCurrency: { XOF: 2500000 }, // 25 000 FCFA
    features: ["menu", "photos", "qr", "video"],
  },
  ORDER: {
    label: "Commande",
    priceCents: 5700, // 39€ + option commande ~18€
    pricesByCurrency: { XOF: 4000000 }, // 40 000 FCFA
    features: ["menu", "photos", "qr", "video", "ordering", "analytics"],
  },
};

// Prix d'un palier dans la devise du restaurant (repli sur le prix par défaut).
export function planPriceCents(plan: Plan, currency: string): number {
  const p = PLANS[plan];
  return p.pricesByCurrency?.[currency] ?? p.priceCents;
}

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
