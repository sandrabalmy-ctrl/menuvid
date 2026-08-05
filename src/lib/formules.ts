// Formules = menus à prix fixe (ex. entrée + plat + dessert).
// Les étapes sont stockées en JSON (comme les options de plat) pour rester
// simple en SQLite.

export type FormuleStep = {
  id: string;
  name: string;
  nameEn?: string | null;
  dishIds: string[]; // plats proposés pour cette étape
};

/** Lecture tolérante du JSON des étapes (ne casse jamais l'affichage). */
export function parseSteps(json: string | null | undefined): FormuleStep[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((s, i) => ({
        id: String(s?.id ?? `step-${i}`),
        name: String(s?.name ?? ""),
        nameEn: s?.nameEn ?? null,
        dishIds: Array.isArray(s?.dishIds) ? s.dishIds.map(String) : [],
      }))
      .filter((s) => s.name && s.dishIds.length > 0);
  } catch {
    return [];
  }
}

/** Construit et valide les données d'une formule depuis un corps de requête. */
export function buildFormuleData(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  if (!name) throw new Error("Le nom de la formule est requis.");

  const priceCents = Math.round(Number(body.priceCents) || 0);
  if (priceCents <= 0) throw new Error("Le prix doit être supérieur à 0.");

  const steps = normalizeSteps(body.steps);
  if (steps.length === 0) {
    throw new Error("Ajoutez au moins une étape avec des plats.");
  }

  return {
    name: name.slice(0, 80),
    nameEn: body.nameEn ? String(body.nameEn).slice(0, 80) : null,
    description: String(body.description ?? "").slice(0, 300),
    descriptionEn: body.descriptionEn
      ? String(body.descriptionEn).slice(0, 300)
      : null,
    priceCents,
    photoUrl: body.photoUrl ? String(body.photoUrl) : null,
    stepsJson: JSON.stringify(steps),
    available: body.available !== false,
  };
}

/** Nettoie/valide les étapes soumises par le back-office avant sauvegarde. */
export function normalizeSteps(input: unknown): FormuleStep[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s, i) => {
      const o = s as Record<string, unknown>;
      return {
        id: String(o?.id ?? `step-${i}`),
        name: String(o?.name ?? "").slice(0, 60).trim(),
        nameEn: o?.nameEn ? String(o.nameEn).slice(0, 60) : null,
        dishIds: Array.isArray(o?.dishIds)
          ? [...new Set((o.dishIds as unknown[]).map(String))]
          : [],
      };
    })
    .filter((s) => s.name.length > 0 && s.dishIds.length > 0);
}

/**
 * Valide la composition choisie par le convive et construit le texte lisible
 * (« Entrée: Salade · Plat: Steak · Dessert: Tarte »).
 * @param chosen  un dishId choisi par étape (ordre des étapes)
 * @param nameOf  résout un id de plat vers son nom (déjà traduit)
 */
export function resolveFormule(
  steps: FormuleStep[],
  chosen: string[],
  nameOf: (dishId: string) => string | null,
  stepLabel: (s: FormuleStep) => string = (s) => s.name
): { valid: boolean; text: string } {
  if (steps.length === 0) return { valid: false, text: "" };
  const parts: string[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const pick = chosen[i];
    // le plat choisi doit appartenir à l'étape et exister encore
    if (!pick || !step.dishIds.includes(pick)) return { valid: false, text: "" };
    const name = nameOf(pick);
    if (!name) return { valid: false, text: "" };
    parts.push(`${stepLabel(step)}: ${name}`);
  }
  return { valid: true, text: parts.join(" · ") };
}
