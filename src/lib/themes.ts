import type { CSSProperties } from "react";

// ============================================================================
//  Thèmes de fond du menu convive (choisis par le restaurateur).
//  Chaque thème définit les couleurs de fond, surfaces, texte et bordures.
//  Les fonds clairs utilisent un texte foncé (et inversement) pour le contraste.
// ============================================================================

export type Theme =
  | "noir"
  | "blanc-casse"
  | "rose-pastel"
  | "vert-pastel"
  | "amazonia";

type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  dark: boolean; // pour la barre d'état du navigateur
};

export const THEMES: Record<Theme, { label: string; swatch: string; palette: Palette }> = {
  noir: {
    label: "Noir",
    swatch: "#0b0b0f",
    palette: {
      bg: "#0b0b0f",
      surface: "#16161d",
      surface2: "#1f1f29",
      text: "#f5f5f7",
      muted: "#a1a1aa",
      border: "#2a2a35",
      dark: true,
    },
  },
  "blanc-casse": {
    label: "Blanc cassé",
    swatch: "#f6f3ec",
    palette: {
      bg: "#f6f3ec",
      surface: "#ffffff",
      surface2: "#eeeae0",
      text: "#1f1d1a",
      muted: "#77726a",
      border: "#e4ded2",
      dark: false,
    },
  },
  "rose-pastel": {
    label: "Rose pastel",
    swatch: "#fbe9ef",
    palette: {
      bg: "#fdf1f5",
      surface: "#ffffff",
      surface2: "#fbe1ea",
      text: "#3a2530",
      muted: "#9c7c88",
      border: "#f4d3de",
      dark: false,
    },
  },
  "vert-pastel": {
    label: "Vert pastel",
    swatch: "#e8f4e8",
    palette: {
      bg: "#eef6ee",
      surface: "#ffffff",
      surface2: "#dfeedd",
      text: "#22302a",
      muted: "#788b7e",
      border: "#d4e6d2",
      dark: false,
    },
  },
  // Fond charbon chaud + accents saumon/or (identité Amazonia Dakar).
  amazonia: {
    label: "Sombre & or (Amazonia)",
    swatch: "#17130f",
    palette: {
      bg: "#17130f",
      surface: "#211b15",
      surface2: "#2c241c",
      text: "#f4ece1",
      muted: "#b6a693",
      border: "#3b3025",
      dark: true,
    },
  },
};

export function getTheme(theme: string): Theme {
  return theme in THEMES ? (theme as Theme) : "noir";
}

// Renvoie les variables CSS à appliquer en style inline (pas de flash au chargement).
export function themeStyle(theme: string, brandColor: string): CSSProperties {
  const p = THEMES[getTheme(theme)].palette;
  return {
    ["--bg" as string]: p.bg,
    ["--surface" as string]: p.surface,
    ["--surface-2" as string]: p.surface2,
    ["--text" as string]: p.text,
    ["--muted" as string]: p.muted,
    ["--border" as string]: p.border,
    ["--brand" as string]: brandColor,
    background: p.bg,
    color: p.text,
  };
}
