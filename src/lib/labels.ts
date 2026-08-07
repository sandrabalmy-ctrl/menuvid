// Libellés + pictogrammes pour les badges affichés sur chaque plat.
// Conforme à l'esprit de la réglementation UE sur l'information allergènes.

type Lang = "fr" | "en";
type Entry = { label: string; en: string; icon: string };

export const ALLERGENS: Record<string, Entry> = {
  gluten: { label: "Gluten", en: "Gluten", icon: "🌾" },
  lactose: { label: "Lait", en: "Milk", icon: "🥛" },
  oeuf: { label: "Œuf", en: "Egg", icon: "🥚" },
  poisson: { label: "Poisson", en: "Fish", icon: "🐟" },
  crustaces: { label: "Crustacés", en: "Shellfish", icon: "🦐" },
  "fruits-a-coque": { label: "Fruits à coque", en: "Nuts", icon: "🥜" },
  arachide: { label: "Arachide", en: "Peanut", icon: "🥜" },
  soja: { label: "Soja", en: "Soy", icon: "🫘" },
  celeri: { label: "Céleri", en: "Celery", icon: "🌿" },
  moutarde: { label: "Moutarde", en: "Mustard", icon: "🌭" },
  sesame: { label: "Sésame", en: "Sesame", icon: "◽" },
  sulfites: { label: "Sulfites", en: "Sulfites", icon: "🍷" },
};

export const DIETS: Record<string, Entry> = {
  vegetarien: { label: "Végétarien", en: "Vegetarian", icon: "🥗" },
  vegan: { label: "Vegan", en: "Vegan", icon: "🌱" },
  // Filtre regroupé (végétarien + vegan) — utilisé par la carte convive.
  veg: { label: "Veg", en: "Veggie", icon: "🌱" },
  "sans-gluten": { label: "Sans gluten", en: "Gluten-free", icon: "🚫🌾" },
  halal: { label: "Halal", en: "Halal", icon: "☪️" },
};

export const BADGES: Record<string, Entry> = {
  populaire: { label: "Populaire", en: "Popular", icon: "⭐" },
  "coup-de-coeur": { label: "Coup de cœur", en: "Chef's pick", icon: "❤️" },
  "plat-du-jour": { label: "Plat du jour", en: "Today's special", icon: "📅" },
};

function localized(e: Entry | undefined, key: string, lang: Lang) {
  if (!e) return { label: key, icon: "•" };
  return { label: lang === "en" ? e.en : e.label, icon: e.icon };
}

export function badgeLabel(key: string, lang: Lang = "fr") {
  return BADGES[key] ? localized(BADGES[key], key, lang) : null;
}
export function allergenLabel(key: string, lang: Lang = "fr") {
  return localized(ALLERGENS[key], key, lang);
}
export function dietLabel(key: string, lang: Lang = "fr") {
  return localized(DIETS[key], key, lang);
}
