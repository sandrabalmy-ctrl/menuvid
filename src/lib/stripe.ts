import Stripe from "stripe";

// ============================================================================
//  Stripe — activé UNIQUEMENT si une clé est présente dans l'environnement.
//  Sans clé (démo locale) : `isStripeConfigured()` renvoie false et l'app
//  bascule en "mode démo" (changements de palier appliqués directement).
//  Pour activer la vraie facturation : renseigner STRIPE_SECRET_KEY et
//  STRIPE_WEBHOOK_SECRET dans .env — rien d'autre à changer.
// ============================================================================

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe non configuré (STRIPE_SECRET_KEY manquant).");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}
