"use client";

import { useState } from "react";
import { createIngreso, updateIngreso } from "@/lib/actions";

type Ingreso = {
  id: string;
  amount: number;
  date: Date;
  type: string;
  source: string | null;
  notes: string | null;
};

function toDateInput(d: Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function hoy() {
  return toDateInput(new Date());
}

export default function IngresoModal({ ingreso, onClose }: { ingreso?: Ingreso; onClose?: () => void }) {
  const esEdicion = !!ingreso;
  const [abierto, setAbierto] = useState(esEdicion);
  const [tipo, setTipo] = useState<"fijo" | "variable">((ingreso?.type as "fijo" | "variable") || "variable");

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo ingreso
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              if (esEdicion) {
                fd.set("id", ingreso!.id);
                await updateIngreso(fd);
              } else {
                await createIngreso(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar ingreso" : "Nuevo ingreso"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1.5">Tipo</label>
            <div className="flex gap-1.5 mb-2.5">
              <button type="button" onClick={() => setTipo("fijo")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "fijo" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Fijo</button>
              <button type="button" onClick={() => setTipo("variable")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "variable" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Variable</button>
            </div>
            <input type="hidden" name="type" value={tipo} />

            <label className="text-xs text-muted block mb-1">Monto</label>
            <input name="amount" type="number" step="any" required defaultValue={ingreso?.amount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="3500" />

            <label className="text-xs text-muted block mb-1">Fecha</label>
            <input name="date" type="date" required defaultValue={ingreso ? toDateInput(ingreso.date) : hoy()} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />

            <label className="text-xs text-muted block mb-1">Fuente (opcional)</label>
            <input name="source" defaultValue={ingreso?.source || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Sueldo, cobro de deuda, regalo..." />

            <label className="text-xs text-muted block mb-1">Nota (opcional)</label>
            <textarea name="notes" defaultValue={ingreso?.notes || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3.5 h-12" />

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">{esEdicion ? "Guardar cambios" : "Agregar ingreso"}</button>
          </form>
        </div>
      )}
    </>
  );
}
