"use client";

import { useState } from "react";
import { updateReglaIngreso } from "@/lib/actions";

type Regla = { pctFijos: number; pctVariable: number; pctAhorro: number };

export default function ReglaIngresoField({ regla }: { regla: Regla }) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState(regla);

  const total = valores.pctFijos + valores.pctVariable + valores.pctAhorro;

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateReglaIngreso(fd);
          setEditando(false);
        }}
        className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4"
      >
        <p className="text-sm font-medium mb-1">Regla de reparto de ingreso</p>
        <p className="text-xs text-muted mb-3">
          Define qué porcentaje de tu ingreso mensual quieres destinar a cada cosa. Se usa como referencia en el hub
          de Ahorro y en Presupuesto.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-xs text-muted block mb-1">Fijos %</label>
            <input
              name="pctFijos"
              type="number"
              step="1"
              value={valores.pctFijos}
              onChange={(e) => setValores({ ...valores, pctFijos: parseFloat(e.target.value) || 0 })}
              autoFocus
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Variable %</label>
            <input
              name="pctVariable"
              type="number"
              step="1"
              value={valores.pctVariable}
              onChange={(e) => setValores({ ...valores, pctVariable: parseFloat(e.target.value) || 0 })}
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Ahorro %</label>
            <input
              name="pctAhorro"
              type="number"
              step="1"
              value={valores.pctAhorro}
              onChange={(e) => setValores({ ...valores, pctAhorro: parseFloat(e.target.value) || 0 })}
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
        </div>
        <p className={`text-xs mb-3 ${total === 100 ? "text-muted" : "text-warning"}`}>
          {total === 100 ? "Suma 100%." : `Suma ${total}% — no tiene que ser exacto, pero cuadra mejor si llega a 100%.`}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setValores(regla);
              setEditando(false);
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted"
          >
            Cancelar
          </button>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white">Guardar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">Regla de reparto de ingreso</p>
          <p className="text-xs text-muted mt-1">
            {regla.pctFijos}% fijos · {regla.pctVariable}% variable · {regla.pctAhorro}% ahorro
          </p>
        </div>
        <button onClick={() => setEditando(true)} className="text-xs text-accent font-medium shrink-0">
          Editar
        </button>
      </div>
    </div>
  );
}
