"use client";

import { useState } from "react";
import { addContribucion, eliminarContribucion } from "@/lib/actions";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";
import { X } from "lucide-react";

type Contribucion = { id: string; amount: number; date: Date };

function borrarConConfirmacion(id: string, monto: string) {
  if (!window.confirm(`¿Eliminar el aporte de S/ ${monto}? Esto también resta el monto de tu meta.`)) return;
  const fd = new FormData();
  fd.set("id", id);
  void eliminarContribucion(fd);
}

export default function MetaAbonoForm({ metaId, contribuciones }: { metaId: string; contribuciones: Contribucion[] }) {
  const [abonando, setAbonando] = useState(false);
  const decimales = useDecimales();

  return (
    <div>
      {abonando ? (
        <form
          action={async (fd) => {
            await addContribucion(fd);
            setAbonando(false);
          }}
          className="flex gap-1.5 mb-4"
        >
          <input type="hidden" name="savingsGoalId" value={metaId} />
          <input
            name="amount"
            type="number"
            step="any"
            autoFocus
            placeholder="Monto"
            className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-sm"
          />
          <button className="text-sm px-4 py-2 rounded-lg bg-accent text-white">Abonar</button>
          <button type="button" onClick={() => setAbonando(false)} className="text-sm px-3 py-2 rounded-lg border border-border">Cancelar</button>
        </form>
      ) : (
        <button
          onClick={() => setAbonando(true)}
          className="w-full text-sm py-2 rounded-lg border border-border hover:border-accent transition-colors mb-4"
        >
          + Abonar
        </button>
      )}

      <p className="text-sm font-medium mb-2">Histórico de aportes</p>
      {contribuciones.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted text-xs">
          Aún no has hecho ningún aporte a esta meta.
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {contribuciones.map((c, i) => (
            <div
              key={c.id}
              className={`flex justify-between items-center px-4 py-3 ${i < contribuciones.length - 1 ? "border-b border-border" : ""}`}
            >
              <p className="text-sm text-muted">
                {new Date(c.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">S/ {formatMonto(c.amount, decimales)}</span>
                <button
                  onClick={() => borrarConConfirmacion(c.id, formatMonto(c.amount, decimales))}
                  className="text-muted hover:text-warning"
                  title="Eliminar aporte"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
