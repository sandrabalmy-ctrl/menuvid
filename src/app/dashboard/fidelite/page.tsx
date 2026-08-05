import Link from "next/link";
import { requireOwner } from "@/lib/require-owner";
import { getLoyaltyMembers } from "@/lib/loyalty-data";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function LoyaltyPage() {
  const { restaurant } = await requireOwner();
  const threshold = restaurant.loyaltyThreshold;
  const data = await getLoyaltyMembers(restaurant.id, threshold);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fidélité 🎟️</h1>
          <p className="text-sm text-muted">
            {restaurant.loyaltyEnabled
              ? `${threshold} visites = ${restaurant.loyaltyReward}`
              : "Programme désactivé."}
          </p>
        </div>
        <Link
          href="/dashboard/apparence"
          className="rounded-xl bg-surface px-4 py-2.5 text-sm"
        >
          Réglages →
        </Link>
      </div>

      {!restaurant.loyaltyEnabled && (
        <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-700">
          La carte de fidélité est désactivée. Activez-la dans{" "}
          <Link href="/dashboard/apparence" className="underline">
            Apparence → Fidélité
          </Link>
          .
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Membres", value: String(data.count) },
          { label: "Points cumulés", value: String(data.totalPoints) },
          { label: "Récompenses prêtes", value: String(data.rewardsReady) },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Membres</h2>
        {data.members.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-10 text-center text-muted">
            Aucun membre pour l’instant. Ils apparaîtront ici dès qu’un client
            créera sa carte.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            <div className="hidden grid-cols-12 gap-2 border-b border-border px-4 py-2 text-xs text-muted md:grid">
              <span className="col-span-5">Client</span>
              <span className="col-span-3">Progression</span>
              <span className="col-span-2">Inscrit</span>
              <span className="col-span-2 text-right">Dernière visite</span>
            </div>
            {data.members.map((m, i) => {
              const ready = m.points >= threshold;
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0"
                >
                  <div className="col-span-12 md:col-span-5">
                    <p className="font-medium">{m.name ?? "—"}</p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <span className="flex items-center gap-2">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{
                            width: `${Math.min(100, (m.points / threshold) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="tabular-nums text-muted">
                        {m.points}/{threshold}
                      </span>
                    </span>
                    {ready && (
                      <span className="text-xs font-medium text-emerald-500">
                        🎉 récompense prête
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-xs text-muted md:col-span-2">
                    {fmtDate(m.joinedAt)}
                  </div>
                  <div className="col-span-3 text-right text-xs text-muted md:col-span-2">
                    {fmtDate(m.lastVisit)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
