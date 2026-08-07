// TVA — les prix affichés sont TTC (taxe comprise), comme en restauration.
// À partir d'un montant TTC et d'un taux en pour-mille (100 = 10,0 %),
// on déduit la part de TVA et le HT. On regroupe les lignes par taux.

export type VatLine = { amountCents: number; vatPermille: number };
export type VatBucket = {
  permille: number;
  ttcCents: number;
  vatCents: number;
  htCents: number;
};

// `discountCents` : remise globale, répartie au prorata sur les lignes.
export function vatBreakdown(lines: VatLine[], discountCents = 0): VatBucket[] {
  const gross = lines.reduce((s, l) => s + l.amountCents, 0);
  if (gross <= 0) return [];
  const scale = Math.max(0, (gross - discountCents) / gross);

  const byRate = new Map<number, number>();
  for (const l of lines) {
    if (!l.vatPermille || l.vatPermille <= 0) continue;
    byRate.set(l.vatPermille, (byRate.get(l.vatPermille) ?? 0) + l.amountCents * scale);
  }

  return [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([permille, raw]) => {
      const ttcCents = Math.round(raw);
      const vatCents = Math.round((ttcCents * permille) / (1000 + permille));
      return { permille, ttcCents, vatCents, htCents: ttcCents - vatCents };
    });
}

// Additionne plusieurs ventilations (agrégat d'une journée).
export function mergeVat(buckets: VatBucket[][]): VatBucket[] {
  const byRate = new Map<number, VatBucket>();
  for (const list of buckets) {
    for (const b of list) {
      const cur = byRate.get(b.permille);
      if (cur) {
        cur.ttcCents += b.ttcCents;
        cur.vatCents += b.vatCents;
        cur.htCents += b.htCents;
      } else {
        byRate.set(b.permille, { ...b });
      }
    }
  }
  return [...byRate.values()].sort((a, b) => a.permille - b.permille);
}

// 100 → "10 %" ; 55 → "5,5 %"
export function formatVatRate(permille: number): string {
  const v = permille / 10;
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
  return `${s} %`;
}
