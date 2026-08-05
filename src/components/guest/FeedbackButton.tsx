"use client";

import { useState } from "react";
import { useLang } from "./lang";

export function FeedbackButton({
  restaurantId,
  tableNumber,
}: {
  restaurantId: string;
  tableNumber: number | null;
}) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const T = {
    open: lang === "en" ? "An issue? Tell us" : "Un souci ? Dites-le-nous",
    title: lang === "en" ? "Your feedback" : "Votre retour",
    intro:
      lang === "en"
        ? "It goes privately to the restaurant."
        : "Il est envoyé en privé au restaurant.",
    ph: lang === "en" ? "Your message…" : "Votre message…",
    send: lang === "en" ? "Send" : "Envoyer",
    thanks: lang === "en" ? "Thank you! 🙏" : "Merci pour votre retour ! 🙏",
  };

  async function submit() {
    if (!message.trim()) return;
    setLoading(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, rating, message, tableNumber }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="underline underline-offset-2"
      >
        💬 {T.open}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-t-3xl border border-border bg-bg p-6 text-left sm:rounded-3xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface text-lg"
              aria-label="Fermer"
            >
              ✕
            </button>

            {sent ? (
              <p className="py-6 text-center font-medium text-emerald-600">
                {T.thanks}
              </p>
            ) : (
              <>
                <h2 className="text-xl font-bold">{T.title}</h2>
                <p className="mt-1 text-sm text-muted">{T.intro}</p>

                <div className="mt-3 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`text-2xl ${n <= rating ? "" : "opacity-30"}`}
                      aria-label={`${n} étoiles`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={T.ph}
                  className="mt-3 w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={submit}
                  disabled={loading || !message.trim()}
                  className="mt-3 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "…" : T.send}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
