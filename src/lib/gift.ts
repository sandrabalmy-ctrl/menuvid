// Roue des cadeaux — types et lecture de la configuration.

export type Prize = { label: string; weight: number };

export type GiftConfig = {
  enabled: boolean;
  googleReviewUrl: string | null;
  prizes: Prize[];
};

export function parsePrizes(json: string | null | undefined): Prize[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v
      .filter((p) => p && typeof p.label === "string" && p.label.trim())
      .map((p) => ({
        label: String(p.label).slice(0, 60),
        weight: Number(p.weight) > 0 ? Number(p.weight) : 1,
      }));
  } catch {
    return [];
  }
}

// Config exploitable côté client. La roue n'est proposée que si elle est
// activée ET qu'il y a au moins 2 lots.
export function giftConfigFrom(r: {
  reviewGiftEnabled: boolean;
  googleReviewUrl: string | null;
  reviewPrizes: string;
}): GiftConfig {
  const prizes = parsePrizes(r.reviewPrizes);
  return {
    enabled: r.reviewGiftEnabled && prizes.length >= 2,
    googleReviewUrl: r.googleReviewUrl,
    prizes,
  };
}
