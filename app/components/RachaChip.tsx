"use client";

import { useState } from "react";

const dias = [
  { d: "L", ok: true },
  { d: "M", ok: true },
  { d: "M", ok: true },
  { d: "J", ok: true },
  { d: "V", ok: true },
  { d: "S", ok: false },
  { d: "D", ok: null },
];

export default function RachaChip() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-accent-soft rounded-full px-4 py-2 text-sm text-accent"
      >
        <span>🔥</span>
        <span>Racha</span>
        <span className="font-medium">12 días</span>
      </button>

      {open && (
        <div className="mt-3 bg-surface border border-border rounded-2xl p-4" style={{ width: 300 }}>
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <p className="text-xl font-semibold text-accent whitespace-nowrap">🔥 12 días</p>
              <p className="text-xs text-muted">Registrando al día</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted">Mejor racha</p>
              <p className="text-sm font-medium">21 días</p>
            </div>
          </div>
          <div className="flex gap-1.5 mb-2 justify-between">
            {dias.map((x, i) => (
              <div key={i} className="text-center" style={{ width: 30 }}>
                <p className="text-[10px] text-muted mb-1">{x.d}</p>
                <div
                  className="rounded-md"
                  style={{
                    width: 30,
                    height: 30,
                    background: x.ok === true ? "var(--positive)" : x.ok === false ? "var(--border)" : "var(--accent-soft)",
                    border: x.ok === null ? "1px dashed var(--accent)" : "none",
                  }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">Sábado sin gastos registrados. Hoy todavía puedes mantener la racha.</p>
        </div>
      )}
    </div>
  );
}
