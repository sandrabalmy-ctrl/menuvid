"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onlinePaymentEnabled: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={toggle}
          disabled={saving}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>
          Autoriser le <b>paiement en ligne</b> à table (carte / Apple Pay)
        </span>
      </label>
      <p className="pl-8 text-xs text-muted">
        Sans clé Stripe (démo), le paiement est simulé. En ligne, il faudra
        connecter votre compte Stripe pour recevoir l’argent.
      </p>
    </div>
  );
}
