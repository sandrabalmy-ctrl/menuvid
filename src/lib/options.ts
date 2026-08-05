// Options/variantes de plat (cuisson, taille, suppléments…).

export type OptionChoice = { id: string; label: string; priceCents: number };
export type OptionGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  choices: OptionChoice[];
};

export function parseOptions(json: string | null | undefined): OptionGroup[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v
      .filter((g) => g && typeof g.name === "string" && Array.isArray(g.choices))
      .map((g) => ({
        id: String(g.id ?? Math.random().toString(36).slice(2)),
        name: String(g.name).slice(0, 60),
        type: (g.type === "multiple" ? "multiple" : "single") as
          | "single"
          | "multiple",
        required: Boolean(g.required),
        choices: g.choices
          .filter((c: unknown) => c && typeof (c as OptionChoice).label === "string")
          .map((c: OptionChoice) => ({
            id: String(c.id ?? Math.random().toString(36).slice(2)),
            label: String(c.label).slice(0, 60),
            priceCents: Math.max(0, Math.round(Number(c.priceCents) || 0)),
          })),
      }))
      .filter((g) => g.choices.length > 0);
  } catch {
    return [];
  }
}

// À partir des groupes et des ids de choix sélectionnés : calcule le supplément
// de prix, le texte lisible, et valide (groupes obligatoires, single = 1 max).
export function resolveOptions(
  groups: OptionGroup[],
  selectedIds: string[]
): { priceDelta: number; text: string; valid: boolean } {
  const map = new Map<string, { choice: OptionChoice; group: OptionGroup }>();
  groups.forEach((g) => g.choices.forEach((c) => map.set(c.id, { choice: c, group: g })));

  let priceDelta = 0;
  const labels: string[] = [];
  const perGroup = new Map<string, number>();

  for (const id of selectedIds) {
    const hit = map.get(id);
    if (!hit) continue;
    priceDelta += hit.choice.priceCents;
    labels.push(
      hit.choice.priceCents > 0 ? `+${hit.choice.label}` : hit.choice.label
    );
    perGroup.set(hit.group.id, (perGroup.get(hit.group.id) ?? 0) + 1);
  }

  let valid = true;
  for (const g of groups) {
    const n = perGroup.get(g.id) ?? 0;
    if (g.type === "single" && n > 1) valid = false;
    if (g.required && n < 1) valid = false;
  }

  return { priceDelta, text: labels.join(" · "), valid };
}
