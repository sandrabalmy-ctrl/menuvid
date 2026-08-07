"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Le jeton vient de l'URL (?token=...) — lu côté client pour éviter Suspense.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("8 caractères minimum, avec au moins une lettre et un chiffre.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/connexion"), 1800);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Impossible de réinitialiser.");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>

      {done ? (
        <p className="mt-6 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700">
          Mot de passe mis à jour ✅ Redirection vers la connexion…
        </p>
      ) : !token ? (
        <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-sm text-muted">
          Lien invalide.{" "}
          <Link href="/mot-de-passe-oublie" className="text-brand">
            Refaire une demande
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nouveau mot de passe (8 car., 1 lettre + 1 chiffre)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Enregistrement…" : "Définir le mot de passe"}
          </button>
        </form>
      )}
    </main>
  );
}
