"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { useDecimales } from "./DecimalesProvider";
import { moverFechaPlanificado } from "@/lib/actions";

type SubFila = { label: string; sublabel?: string; amount: number; id?: string; fecha?: string };
type Fila = SubFila & { detalle?: SubFila[] };

export default function LineaExpandible({
  label,
  badge,
  total,
  filas,
  signo = "-",
}: {
  label: string;
  badge?: string;
  total: number;
  filas: Fila[];
  signo?: "+" | "-";
}) {
  const [abierto, setAbierto] = useState(false);
  const [filaAbierta, setFilaAbierta] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const decimales = useDecimales();
  const esIngreso = signo === "+";

  function Monto({ item }: { item: SubFila }) {
    if (item.id && item.fecha && editandoId === item.id) {
      return (
        <form
          action={async (fd) => {
            await moverFechaPlanificado(fd);
            setEditandoId(null);
          }}
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="hidden" name="id" value={item.id} />
          <input
            name="date"
            type="date"
            defaultValue={item.fecha}
            autoFocus
            className="border border-border rounded px-1 py-0.5 text-[10px] bg-background w-[110px]"
          />
          <button className="text-[10px] text-accent font-medium">Guardar</button>
        </form>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        S/ {formatMonto(item.amount, decimales)}
        {item.id && item.fecha && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditandoId(item.id!);
            }}
            className="text-muted hover:text-accent transition-colors"
            title="Cambiar fecha"
          >
            <Pencil size={10} strokeWidth={2} />
          </button>
        )}
      </span>
    );
  }

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
        <span className={esIngreso ? "text-positive" : "text-foreground"}>
          {esIngreso ? "+" : "−"} S/ {formatMonto(total, decimales)}
        </span>
      </button>

      {abierto && (
        <div className="mt-1.5 mb-1 border border-border rounded-lg overflow-hidden">
          {filas.length === 0 ? (
            <p className="text-xs text-muted px-3 py-2">Sin elementos.</p>
          ) : (
            filas.map((f, i) => {
              const tieneDetalle = !!f.detalle && f.detalle.length > 0;
              const totalDetalle = tieneDetalle ? f.detalle!.reduce((s, d) => s + d.amount, 0) : 0;
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
                  <Monto item={f} />
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
                          className="flex justify-between items-center py-1 text-[11px] border-b border-border/60"
                        >
                          <span className="text-muted">
                            {d.label}
                            {d.sublabel ? ` · ${d.sublabel}` : ""}
                          </span>
                          <span className="text-muted">
                            <Monto item={d} />
                          </span>
                        </div>
                      ))}
                      {f.detalle!.length > 1 && Math.abs(totalDetalle - f.amount) > 0.01 && (
                        <div className="flex justify-between items-center pt-1.5 text-[11px] font-medium">
                          <span>Total si pagaras todo esto</span>
                          <span>S/ {formatMonto(totalDetalle, decimales)}</span>
                        </div>
                      )}
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
