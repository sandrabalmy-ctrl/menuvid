import { getRestaurantsOverview, getMRR } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { AdminConsole } from "@/components/admin/AdminConsole";

export default async function AdminHome() {
  const [restaurants, mrr] = await Promise.all([
    getRestaurantsOverview(),
    getMRR(),
  ]);
  const active = restaurants.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Restaurants clients</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Restaurants", value: String(restaurants.length) },
          { label: "Actifs", value: String(active) },
          { label: "Revenu mensuel (MRR)", value: formatPrice(mrr, "EUR") },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <AdminConsole restaurants={restaurants} />
    </div>
  );
}
