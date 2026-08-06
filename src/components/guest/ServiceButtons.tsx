"use client";

import { useState } from "react";
import { useLang } from "./lang";

export function ServiceButtons({
  restaurantId,
  tableNumber,
  showWaiter = true,
  showBill = true,
  gold = false,
}: {
  restaurantId: string;
  tableNumber: number;
  showWaiter?: boolean;
  showBill?: boolean;
  gold?: boolean;
}) {
  const { t } = useLang();
  const [sent, setSent] = useState<string | null>(null);

  async function send(type: "CALL_WAITER" | "BILL") {
    setSent(type);
    try {
      await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, tableNumber, type }),
      });
    } catch {}
    setTimeout(() => setSent(null), 4000);
  }

  // Style « pastille dorée » (pour le hub du logo) ou bouton standard.
  const cls = gold
    ? "flex items-center justify-center gap-1.5 rounded-full border border-brand/60 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition active:scale-95"
    : "rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition active:scale-[0.98]";
  const count = (showWaiter ? 1 : 0) + (showBill ? 1 : 0);

  return (
    <div className={count === 2 ? "grid grid-cols-2 gap-2" : "flex gap-2"}>
      {showWaiter && (
        <button onClick={() => send("CALL_WAITER")} className={cls}>
          {sent === "CALL_WAITER" ? `✅ ${t("waiterSent")}` : `🙋 ${t("callWaiter")}`}
        </button>
      )}
      {showBill && (
        <button onClick={() => send("BILL")} className={cls}>
          {sent === "BILL" ? `✅ ${t("billSent")}` : `🧾 ${t("bill")}`}
        </button>
      )}
    </div>
  );
}
