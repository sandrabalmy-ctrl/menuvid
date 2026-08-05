// ============================================================================
//  Limiteur de tentatives (anti-force brute) — en mémoire.
//  Suffisant pour une instance unique (démo, petit déploiement).
//  ⚠️ Pour un déploiement multi-instances (mise à l'échelle), remplacer par
//  un store partagé (Redis / Upstash). L'interface ne changera pas.
// ============================================================================

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Autorise `limit` tentatives par fenêtre de `windowMs`. Renvoie false si bloqué.
export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryInSec: number } {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryInSec: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, retryInSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { allowed: true, retryInSec: 0 };
}

// Réinitialise le compteur (ex. après une connexion réussie).
export function clearRateLimit(key: string) {
  buckets.delete(key);
}
