"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "./lang";

type Status = {
  enabled: boolean;
  threshold: number;
  reward: string;
  loggedIn: boolean;
  name?: string | null;
  points?: number;
  rewardReady?: boolean;
};

const S = {
  fr: {
    card: "Carte de fidélité",
    subtitle: (n: number, r: string) => `${n} visites = ${r}`,
    hello: (n: string) => `Bonjour ${n} 👋`,
    visits: "visites",
    rewardReady: "🎉 Récompense débloquée !",
    use: "Utiliser ma récompense",
    show: "Montrez cet écran au personnel.",
    login: "J'ai déjà un compte",
    signup: "Créer un compte",
    email: "Email",
    password: "Mot de passe",
    name: "Prénom (facultatif)",
    logout: "Se déconnecter",
    almost: (left: number) => `Plus que ${left} visite(s) !`,
    intro: "Cumulez des points à chaque visite.",
  },
  en: {
    card: "Loyalty card",
    subtitle: (n: number, r: string) => `${n} visits = ${r}`,
    hello: (n: string) => `Hi ${n} 👋`,
    visits: "visits",
    rewardReady: "🎉 Reward unlocked!",
    use: "Use my reward",
    show: "Show this screen to the staff.",
    login: "I already have an account",
    signup: "Create an account",
    email: "Email",
    password: "Password",
    name: "First name (optional)",
    logout: "Log out",
    almost: (left: number) => `Only ${left} visit(s) left!`,
    intro: "Earn points on every visit.",
  },
};

type Strings = (typeof S)["fr"];

export function LoyaltyCard({
  restaurantId,
  gold = false,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  restaurantId: string;
  gold?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  hideTrigger?: boolean;
}) {
  const { lang } = useLang();
  const t = S[lang];
  const [data, setData] = useState<Status | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/loyalty?restaurantId=${restaurantId}`, {
        cache: "no-store",
      });
      if (res.ok) setData(await res.json());
    } catch {}
  }, [restaurantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data || !data.enabled) return null;
  const points = data.points ?? 0;

  return (
    <>
      {!hideTrigger && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t.card}
          title={t.card}
          className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
            gold
              ? "border border-brand/60 bg-brand/10 text-brand ring-1 ring-brand/30"
              : "bg-surface font-medium shadow-sm ring-1 ring-border"
          }`}
        >
          <span>🎟️</span>
          <span>{lang === "en" ? "Loyalty" : "Fidélité"}</span>
          {data.loggedIn && (
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white ${
                data.rewardReady ? "bg-emerald-500" : "bg-brand"
              }`}
            >
              {data.rewardReady ? "🎁" : points}
            </span>
          )}
        </button>
      )}

      {open &&
        (data.loggedIn ? (
          <ProgressModal
            restaurantId={restaurantId}
            data={data}
            onChanged={refresh}
            onClose={() => setOpen(false)}
            t={t}
          />
        ) : (
          <AuthModal onClose={() => setOpen(false)} onDone={refresh} t={t} />
        ))}
    </>
  );
}

function Sheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl border border-border bg-bg p-6 sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface text-lg"
          aria-label="Fermer"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function ProgressModal({
  restaurantId,
  data,
  onChanged,
  onClose,
  t,
}: {
  restaurantId: string;
  data: Status;
  onChanged: () => void;
  onClose: () => void;
  t: Strings;
}) {
  const points = data.points ?? 0;
  const pct = Math.min(100, (points / data.threshold) * 100);
  const left = Math.max(0, data.threshold - points);

  async function redeem() {
    await fetch("/api/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId }),
    });
    onChanged();
  }
  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" });
    onChanged();
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-bold">🎟️ {t.card}</h2>
      {data.name && <p className="mt-1 text-sm text-muted">{t.hello(data.name)}</p>}

      {data.rewardReady ? (
        <div className="mt-4 rounded-2xl bg-brand/10 p-4 text-center">
          <p className="font-semibold text-brand">{t.rewardReady}</p>
          <p className="mt-0.5">{data.reward}</p>
          <button
            onClick={redeem}
            className="mt-3 rounded-full bg-brand px-6 py-2.5 font-semibold text-white"
          >
            {t.use}
          </button>
          <p className="mt-1.5 text-xs text-muted">{t.show}</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {points}/{data.threshold} {t.visits} ·{" "}
            {t.subtitle(data.threshold, data.reward)}
          </p>
          {left <= 2 && left > 0 && (
            <p className="mt-1 text-sm font-medium text-brand">{t.almost(left)}</p>
          )}
        </div>
      )}

      <button
        onClick={logout}
        className="mt-5 w-full text-center text-sm text-muted underline"
      >
        {t.logout}
      </button>
    </Sheet>
  );
}

function AuthModal({
  onClose,
  onDone,
  t,
}: {
  onClose: () => void;
  onDone: () => void;
  t: Strings;
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = mode === "signup" ? "/api/customer/signup" : "/api/customer/login";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) onDone();
    else {
      setError(j.error || "Erreur");
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-bold">🎟️ {t.card}</h2>
      <p className="mt-1 text-sm text-muted">{t.intro}</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.name}
            className={input}
          />
        )}
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className={input}
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.password}
          className={input}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {mode === "signup" ? t.signup : t.login}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        className="mt-3 w-full text-center text-sm text-muted underline"
      >
        {mode === "signup" ? t.login : t.signup}
      </button>
    </Sheet>
  );
}
