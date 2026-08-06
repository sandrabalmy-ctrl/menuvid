"use client";

import { useState } from "react";

// « Page » plein écran ouverte en touchant le logo : le logo au centre,
// entouré des 3 choix (Fidélité, Cadeaux, Addition) en doré.
function HubItem({
  icon,
  label,
  onClick,
  className,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute flex w-24 flex-col items-center gap-1.5 ${className}`}
    >
      <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-brand/60 bg-brand/10 text-2xl shadow-lg ring-1 ring-brand/30 transition active:scale-90">
        {icon}
      </span>
      <span className="text-center text-xs font-semibold uppercase tracking-wide text-brand">
        {label}
      </span>
    </button>
  );
}

export function ActionsHub({
  logoUrl,
  name,
  lang,
  restaurantId,
  tableNumber,
  loyaltyEnabled,
  giftEnabled,
  onClose,
  onLoyalty,
  onWheel,
}: {
  logoUrl: string | null;
  name: string;
  lang: "fr" | "en";
  restaurantId: string;
  tableNumber: number | null;
  loyaltyEnabled: boolean;
  giftEnabled: boolean;
  onClose: () => void;
  onLoyalty: () => void;
  onWheel: () => void;
}) {
  const [billSent, setBillSent] = useState(false);

  async function askBill() {
    setBillSent(true);
    try {
      await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, tableNumber, type: "BILL" }),
      });
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg px-6 animate-fade-in">
      <button
        onClick={onClose}
        aria-label={lang === "en" ? "Close" : "Fermer"}
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-surface text-lg ring-1 ring-border active:scale-90"
      >
        ✕
      </button>

      <p className="mb-12 text-center font-display text-2xl font-semibold text-brand">
        {lang === "en" ? "What would you like to do?" : "Que souhaitez-vous faire ?"}
      </p>

      {/* Logo au centre, entouré des 3 choix */}
      <div className="relative h-72 w-72">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={name}
              className="h-28 w-28 rounded-2xl object-contain shadow-xl ring-2 ring-brand/40"
            />
          ) : (
            <span className="font-display text-2xl font-semibold text-brand">
              {name}
            </span>
          )}
        </div>

        {loyaltyEnabled && (
          <HubItem
            icon="🎟️"
            label={lang === "en" ? "Loyalty" : "Fidélité"}
            onClick={onLoyalty}
            className="left-1/2 top-0 -translate-x-1/2"
          />
        )}
        {giftEnabled && (
          <HubItem
            icon="🎡"
            label={lang === "en" ? "Rewards" : "Cadeaux"}
            onClick={onWheel}
            className="bottom-0 left-0"
          />
        )}
        {tableNumber != null && (
          <HubItem
            icon={billSent ? "✅" : "🧾"}
            label={
              billSent
                ? lang === "en"
                  ? "Requested"
                  : "Demandée"
                : lang === "en"
                  ? "Bill"
                  : "Addition"
            }
            onClick={askBill}
            className="bottom-0 right-0"
          />
        )}
      </div>
    </div>
  );
}
