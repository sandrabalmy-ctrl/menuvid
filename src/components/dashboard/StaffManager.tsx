"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; email: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  STAFF: "Salle",
  KITCHEN: "Cuisine",
};

export function StaffManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setEmail("");
      setPassword("");
      router.refresh();
    } else setError(j.error || "Création impossible.");
    setBusy(false);
  }

  async function remove(m: Member) {
    if (!confirm(`Retirer ${m.email} de l'équipe ?`)) return;
    setBusy(true);
    await fetch(`/api/staff/${m.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  const input =
    "rounded-xl bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-border p-4">
        <h3 className="font-semibold">Ajouter un membre</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={input}
          />
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (8 car., 1 lettre + 1 chiffre)"
            className={input}
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`${input} w-full`}
        >
          <option value="STAFF">Salle (commandes, menu, tables, stats)</option>
          <option value="KITCHEN">Cuisine (écran cuisine uniquement)</option>
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Créer le compte
        </button>
      </form>

      <div>
        <h3 className="mb-2 font-semibold">Membres ({members.length})</h3>
        {members.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
            Aucun membre pour l’instant.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{m.email}</p>
                  <p className="text-xs text-muted">
                    {ROLE_LABEL[m.role] ?? m.role}
                  </p>
                </div>
                <button
                  onClick={() => remove(m)}
                  disabled={busy}
                  className="text-sm text-muted hover:text-red-400"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
