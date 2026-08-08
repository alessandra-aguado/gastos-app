"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { useDecimales } from "../components/DecimalesProvider";

type Fila = { label: string; sublabel?: string; amount: number };

export default function LineaExpandible({
  label,
  badge,
  total,
  filas,
}: {
  label: string;
  badge?: string;
  total: number;
  filas: Fila[];
}) {
  const [abierto, setAbierto] = useState(false);
  const decimales = useDecimales();

  return (
    <div className="py-1.5">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex justify-between items-center text-sm text-muted hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1">
          {label}
          {badge && <span className="bg-accent-soft text-accent text-[10px] px-1.5 py-0.5 rounded ml-1">{badge}</span>}
          <ChevronDown size={12} strokeWidth={2} className={`text-muted transition-transform ${abierto ? "" : "-rotate-90"}`} />
        </span>
        <span className="text-foreground">− S/ {formatMonto(total, decimales)}</span>
      </button>

      {abierto && (
        <div className="mt-1.5 mb-1 border border-border rounded-lg overflow-hidden">
          {filas.length === 0 ? (
            <p className="text-xs text-muted px-3 py-2">Sin elementos.</p>
          ) : (
            filas.map((f, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-3 py-1.5 text-xs ${i < filas.length - 1 ? "border-b border-border" : ""}`}
              >
                <span className="text-muted">
                  {f.label}
                  {f.sublabel ? ` · ${f.sublabel}` : ""}
                </span>
                <span>S/ {formatMonto(f.amount, decimales)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
