import Link from "next/link";
import { requireStaff } from "@/lib/require-owner";
import { db } from "@/lib/db";
import { PrintButton } from "@/components/dashboard/PrintButton";

// Feuille imprimable : tous les QR codes en grille, sur fond blanc.
export default async function PrintTablesPage() {
  const { restaurant } = await requireStaff();
  const tables = await db.diningTable.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 print:hidden">
        <Link href="/dashboard/tables" className="text-sm text-muted">
          ← Retour
        </Link>
        <PrintButton />
      </div>

      {/* Zone imprimable (blanche) */}
      <div className="rounded-2xl bg-white p-6 text-black">
        <h1 className="mb-1 text-center text-xl font-bold">{restaurant.name}</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Scannez pour découvrir le menu et commander
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {tables.map((t) => (
            <div
              key={t.id}
              className="flex break-inside-avoid flex-col items-center gap-2 rounded-xl border border-gray-200 p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/tables/${t.id}/qr`}
                alt={`QR table ${t.number}`}
                className="h-40 w-40"
              />
              <p className="text-lg font-bold">Table {t.number}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
