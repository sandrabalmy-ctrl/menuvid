"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Table = { id: string; number: number };

export function TablesManager({ tables }: { tables: Table[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function addTable() {
    setBusy(true);
    await fetch("/api/tables", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function removeTable(t: Table) {
    if (!confirm(`Supprimer la table ${t.number} ?`)) return;
    setBusy(true);
    await fetch(`/api/tables/${t.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={addTable}
          disabled={busy}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          + Ajouter une table
        </button>
        <Link
          href="/dashboard/tables/impression"
          className="rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold"
        >
          🖨 Imprimer tous les QR
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3"
          >
            <div className="rounded-xl bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tables/${t.id}/qr`}
                alt={`QR table ${t.number}`}
                className="h-28 w-28"
              />
            </div>
            <p className="font-semibold">Table {t.number}</p>
            <div className="flex gap-2">
              <a
                href={`/api/tables/${t.id}/qr`}
                download={`qr-table-${t.number}.png`}
                className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs"
              >
                Télécharger
              </a>
              <button
                onClick={() => removeTable(t)}
                disabled={busy}
                className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-red-400"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
