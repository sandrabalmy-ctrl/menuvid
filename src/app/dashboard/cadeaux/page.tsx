import { requireOwner } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { parsePrizes } from "@/lib/gift";
import { GiftEditor } from "@/components/dashboard/GiftEditor";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function GiftPage() {
  const { restaurant } = await requireOwner();
  const proofs = await db.reviewProof.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  const feedback = await db.feedback.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roue des cadeaux 🎁</h1>
        <p className="text-sm text-muted">
          Vos clients laissent un avis Google, envoient la capture, puis tournent
          la roue. Un excellent moyen de récolter des avis et de fidéliser.
        </p>
      </div>

      <GiftEditor
        enabled={restaurant.reviewGiftEnabled}
        googleReviewUrl={restaurant.googleReviewUrl}
        prizes={parsePrizes(restaurant.reviewPrizes)}
      />

      <section>
        <h2 className="mb-1 font-semibold">
          Retours privés des clients{" "}
          <span className="text-muted">({feedback.length})</span>
        </h2>
        <p className="mb-3 text-xs text-muted">
          Messages envoyés directement au restaurant (avant un avis public) —
          idéal pour rattraper une insatisfaction.
        </p>
        {feedback.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
            Aucun retour pour l’instant.
          </p>
        ) : (
          <div className="space-y-2">
            {feedback.map((f) => (
              <div key={f.id} className="rounded-xl bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {f.rating ? "⭐".repeat(f.rating) : "—"}
                    {f.tableNumber != null && (
                      <span className="ml-2 text-xs text-muted">
                        Table {f.tableNumber}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted">{fmt(f.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-semibold">
          Preuves d’avis reçues{" "}
          <span className="text-muted">({proofs.length})</span>
        </h2>
        <p className="mb-3 text-xs text-muted">
          Captures envoyées par vos clients. Vérifiez-les si besoin — c’est votre
          trace en cas d’abus.
        </p>
        {proofs.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
            Aucune capture pour l’instant.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {proofs.map((p) => (
              <a
                key={p.id}
                href={p.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt="Capture d'avis"
                  className="aspect-square w-full object-cover"
                />
                <p className="px-2 py-1 text-[10px] text-muted">
                  {fmt(p.createdAt)}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
