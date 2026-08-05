// Formatage des prix : on stocke en centimes, on affiche joliment.
//
// ⚠️ IMPORTANT (hydratation Safari) : on N'UTILISE PAS `Intl.NumberFormat`.
// Selon la version d'ICU, Node (serveur) et Safari (Mac/iOS) formatent la même
// devise différemment — surtout le symbole XOF (« F CFA » vs « FCFA » vs « CFA »)
// et le type d'espace. Ces écarts serveur/navigateur cassent l'HYDRATATION React
// et gèlent l'interactivité de toute la page (boutons qui ne répondent plus).
// On formate donc MANUELLEMENT : le résultat est identique partout, garanti.

type CurrencyRule = { decimals: number; prefix?: string; suffix?: string };

const CURRENCIES: Record<string, CurrencyRule> = {
  EUR: { decimals: 2, suffix: " €" },
  XOF: { decimals: 0, suffix: " FCFA" }, // Franc CFA (Afrique de l'Ouest)
  XAF: { decimals: 0, suffix: " FCFA" }, // Franc CFA (Afrique centrale)
  USD: { decimals: 2, prefix: "$" },
  GBP: { decimals: 2, prefix: "£" },
  CHF: { decimals: 2, suffix: " CHF" },
  MAD: { decimals: 2, suffix: " DH" },
  CAD: { decimals: 2, prefix: "$" },
};

export function formatPrice(cents: number, currency = "EUR") {
  const rule = CURRENCIES[currency] ?? { decimals: 2, suffix: " " + currency };
  const value = (cents || 0) / 100;
  const fixed = Math.abs(value).toFixed(rule.decimals); // "10000" ou "12.50"
  const [intPart, decPart] = fixed.split(".");
  // Séparateur de milliers : espace normal (identique partout).
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = value < 0 ? "-" : "";
  const body = rule.decimals > 0 ? `${grouped},${decPart}` : grouped; // virgule FR
  return `${sign}${rule.prefix ?? ""}${body}${rule.suffix ?? ""}`;
}

// Les allergènes/régimes sont stockés en JSON (contrainte SQLite).
// Ces helpers évitent de manipuler du JSON brut partout dans le code.
export function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function stringifyList(list: string[]): string {
  return JSON.stringify(list ?? []);
}
