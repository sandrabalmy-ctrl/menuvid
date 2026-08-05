"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
    >
      🖨 Lancer l’impression
    </button>
  );
}
