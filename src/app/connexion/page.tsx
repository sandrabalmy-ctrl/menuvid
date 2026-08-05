"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Page de connexion du restaurateur au back-office.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      const dest =
        j.role === "SUPERADMIN"
          ? "/admin"
          : j.role === "KITCHEN"
            ? "/cuisine"
            : j.role === "STAFF"
              ? "/dashboard/commandes"
              : "/dashboard";
      router.push(dest);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Connexion impossible");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <div className="text-4xl">🎬🍽️</div>
        <h1 className="mt-3 text-2xl font-bold">Espace restaurateur</h1>
        <p className="mt-1 text-sm text-muted">Connectez-vous à votre menu.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white active:scale-[0.99] transition disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <a
        href="/mot-de-passe-oublie"
        className="mt-3 block text-center text-sm text-muted hover:text-text"
      >
        Mot de passe oublié ?
      </a>

      <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-center text-xs text-muted">
        Démo : <span className="text-text">marco@demo.fr</span> / <span className="text-text">demo1234</span>
      </p>
    </main>
  );
}
