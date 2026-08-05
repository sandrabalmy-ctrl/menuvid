"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PLANS } from "@/lib/plan";

// ownerOnly : onglets qui contiennent les chiffres du business (CA, panier
// moyen, performance) → invisibles pour le personnel de salle.
const TABS = [
  { href: "/dashboard", label: "Tableau de bord", icon: "📊", ownerOnly: true },
  { href: "/dashboard/menu", label: "Menu", icon: "🍽️" },
  { href: "/dashboard/formules", label: "Formules", icon: "📋" },
  { href: "/dashboard/commandes", label: "Commandes", icon: "🧾" },
  { href: "/dashboard/tables", label: "Tables & QR", icon: "🔳" },
  { href: "/dashboard/stats", label: "Statistiques", icon: "📈", ownerOnly: true },
];

export function DashboardNav({
  restaurantName,
  plan,
  role,
}: {
  restaurantName: string;
  plan: string;
  role: string;
}) {
  const isOwner = role === "OWNER";
  const pathname = usePathname();
  const router = useRouter();
  const [demands, setDemands] = useState(0);

  // Sonde les demandes de service en attente (visible depuis toutes les pages).
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/dashboard/service-requests", {
          cache: "no-store",
        });
        if (res.ok && alive) {
          const j = await res.json();
          setDemands(j.requests?.length ?? 0);
        }
      } catch {}
    }
    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/connexion");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Barre haute */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur print:hidden md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬🍽️</span>
          <div className="leading-tight">
            <p className="font-semibold">{restaurantName}</p>
            <p className="text-xs text-muted">
              Palier {PLANS[plan as keyof typeof PLANS]?.label ?? plan}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/cuisine"
            className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            🍳 Cuisine
          </Link>
          {isOwner && (
            <>
              <Link
                href="/dashboard/apparence"
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith("/dashboard/apparence")
                    ? "bg-surface text-brand"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                🎨 Apparence
              </Link>
              <Link
                href="/dashboard/cadeaux"
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith("/dashboard/cadeaux")
                    ? "bg-surface text-brand"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                🎁 Avis
              </Link>
              <Link
                href="/dashboard/equipe"
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith("/dashboard/equipe")
                    ? "bg-surface text-brand"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                👥 Équipe
              </Link>
              <Link
                href="/dashboard/abonnement"
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith("/dashboard/abonnement")
                    ? "bg-surface text-brand"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                💳 Abonnement
              </Link>
            </>
          )}
          <button
            onClick={logout}
            className="rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Onglets (barre du bas sur mobile, sous l'en-tête sur desktop) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-bg/95 backdrop-blur print:hidden md:static md:justify-start md:gap-1 md:border-b md:border-t-0 md:px-4">
        {TABS.filter((t) => isOwner || !t.ownerOnly).map((t) => {
          const badge = t.href === "/dashboard/commandes" ? demands : 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] md:max-w-40 md:flex-row md:gap-2 md:px-4 md:py-3 md:text-sm ${
                isActive(t.href)
                  ? "text-brand md:border-b-2 md:border-brand"
                  : "text-muted"
              }`}
            >
              <span className="relative text-lg md:text-base">
                {t.icon}
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 animate-pulse place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
