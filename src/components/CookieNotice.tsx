"use client";

import { useEffect, useState } from "react";

// Bandeau d'information RGPD. L'app n'utilise que du stockage ESSENTIEL/fonctionnel
// (session de connexion, panier, langue) — pas de traceurs publicitaires tiers —
// donc un bandeau informatif dismissible suffit (pas de consentement granulaire).
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("menuvid:cookie-ok")) setShow(true);
    } catch {}
  }, []);

  function accept() {
    try {
      localStorage.setItem("menuvid:cookie-ok", "1");
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-2xl sm:flex-row">
        <p className="text-muted">
          Nous utilisons uniquement des cookies et un stockage local{" "}
          <b className="text-text">essentiels</b> (connexion, panier, langue). Aucun
          traceur publicitaire.{" "}
          <a href="/confidentialite" className="text-brand underline">
            En savoir plus
          </a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-brand px-5 py-2 font-semibold text-white"
        >
          J’ai compris
        </button>
      </div>
    </div>
  );
}
