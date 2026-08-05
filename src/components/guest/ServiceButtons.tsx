"use client";

import { useState } from "react";
import { useLang } from "./lang";

export function ServiceButtons({
  restaurantId,
  tableNumber,
}: {
  restaurantId: string;
  tableNumber: number;
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

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => send("CALL_WAITER")}
        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition active:scale-[0.98]"
      >
        {sent === "CALL_WAITER" ? `✅ ${t("waiterSent")}` : `🙋 ${t("callWaiter")}`}
      </button>
      <button
        onClick={() => send("BILL")}
        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium transition active:scale-[0.98]"
      >
        {sent === "BILL" ? `✅ ${t("billSent")}` : `🧾 ${t("bill")}`}
      </button>
    </div>
  );
}
