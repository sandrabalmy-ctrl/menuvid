"use client";

import { useRouter } from "next/navigation";

export function AdminHeader() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/connexion");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <span className="text-xl">🛠️</span>
        <div className="leading-tight">
          <p className="font-semibold">MenuVid — Super-admin</p>
          <p className="text-xs text-muted">Gestion des restaurants clients</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
      >
        Déconnexion
      </button>
    </header>
  );
}
