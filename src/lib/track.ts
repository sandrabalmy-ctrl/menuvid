"use client";

// Petit traqueur d'analytics côté convive (fire-and-forget, n'attend pas la réponse).
// On enregistre : vue vidéo, ajout au panier, commande — pour les stats du resto.

let restaurantId: string | null = null;

export function initTrack(id: string) {
  restaurantId = id;
}

export function track(type: "VIDEO_VIEW" | "ADD_TO_CART" | "ORDER", dishId?: string) {
  if (!restaurantId) return;
  try {
    const body = JSON.stringify({ restaurantId, type, dishId });
    // sendBeacon = fiable même si l'utilisateur quitte la page
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", body);
    } else {
      fetch("/api/events", { method: "POST", body, keepalive: true });
    }
  } catch {}
}
