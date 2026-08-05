"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json().catch(() => ({}));
    setDevLink(j.devLink ?? null);
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-muted">
        Entrez votre email : nous vous enverrons un lien de réinitialisation.
      </p>

      {sent ? (
        <div className="mt-6 space-y-3">
          <p className="rounded-xl bg-surface px-4 py-3 text-sm">
            Si un compte existe pour <b>{email}</b>, un email vient d’être envoyé.
          </p>
          {devLink && (
            <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-xs text-amber-700">
              Mode démo (sans email configuré) — lien de test :{" "}
              <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="underline">
                réinitialiser mon mot de passe
              </Link>
            </p>
          )}
          <Link href="/connexion" className="inline-block text-sm text-brand">
            ← Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
          <Link
            href="/connexion"
            className="block text-center text-sm text-muted"
          >
            ← Retour à la connexion
          </Link>
        </form>
      )}
    </main>
  );
}
