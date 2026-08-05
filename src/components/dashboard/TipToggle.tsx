"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TipToggle({ enabled }: { enabled: boolean }) {
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
      body: JSON.stringify({ tipEnabled: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={on}
        onChange={toggle}
        disabled={saving}
        className="h-5 w-5 accent-[var(--brand)]"
      />
      <span>
        Proposer un <b>pourboire</b> au moment de la commande (5 % / 10 % / 15 %)
      </span>
    </label>
  );
}
