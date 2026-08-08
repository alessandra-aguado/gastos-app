"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { useDecimales } from "./DecimalesProvider";

type SubFila = { label: string; sublabel?: string; amount: number };
type Fila = { label: string; sublabel?: string; amount: number; detalle?: SubFila[] };

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
  const [filaAbierta, setFilaAbierta] = useState<number | null>(null);
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
            filas.map((f, i) => {
              const tieneDetalle = !!f.detalle && f.detalle.length > 0;
              const fila = (
                <div className="flex justify-between items-center px-3 py-1.5 text-xs">
                  <span className="text-muted flex items-center gap-1">
                    {f.label}
                    {f.sublabel ? ` · ${f.sublabel}` : ""}
                    {tieneDetalle && (
                      <ChevronDown
                        size={11}
                        strokeWidth={2}
                        className={`text-muted transition-transform ${filaAbierta === i ? "" : "-rotate-90"}`}
                      />
                    )}
                  </span>
                  <span>S/ {formatMonto(f.amount, decimales)}</span>
                </div>
              );
              return (
                <div key={i} className={i < filas.length - 1 ? "border-b border-border" : ""}>
                  {tieneDetalle ? (
                    <button
                      onClick={() => setFilaAbierta((cur) => (cur === i ? null : i))}
                      className="w-full text-left hover:bg-background transition-colors"
                    >
                      {fila}
                    </button>
                  ) : (
                    fila
                  )}
                  {tieneDetalle && filaAbierta === i && (
                    <div className="bg-background px-3 py-1.5">
                      {f.detalle!.map((d, j) => (
                        <div
                          key={j}
                          className={`flex justify-between items-center py-1 text-[11px] ${j < f.detalle!.length - 1 ? "border-b border-border/60" : ""}`}
                        >
                          <span className="text-muted">
                            {d.label}
                            {d.sublabel ? ` · ${d.sublabel}` : ""}
                          </span>
                          <span className="text-muted">S/ {formatMonto(d.amount, decimales)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
