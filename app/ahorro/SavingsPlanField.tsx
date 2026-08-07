"use client";

import { useState } from "react";
import { upsertSavingsPlan } from "@/lib/actions";

type Plan = {
  totalAmount: number;
  colchonAmount: number;
  inversionAmount: number;
  metasAmount: number;
} | null;

export default function SavingsPlanField({ month, plan }: { month: string; plan: Plan }) {
  const [editando, setEditando] = useState(!plan);

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await upsertSavingsPlan(fd);
          setEditando(false);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="month" value={month} />
        <div>
          <label className="text-xs text-muted block mb-1">¿Cuánto planeas ahorrar este mes en total?</label>
          <input
            name="totalAmount"
            type="number"
            step="0.01"
            defaultValue={plan?.totalAmount ?? undefined}
            placeholder="500"
            autoFocus
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
          />
        </div>
        <p className="text-xs text-muted">Reparto sugerido (opcional):</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted block mb-1">Colchón</label>
            <input
              name="colchonAmount"
              type="number"
              step="0.01"
              defaultValue={plan?.colchonAmount ?? undefined}
              placeholder="0"
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Inversión</label>
            <input
              name="inversionAmount"
              type="number"
              step="0.01"
              defaultValue={plan?.inversionAmount ?? undefined}
              placeholder="0"
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Metas</label>
            <input
              name="metasAmount"
              type="number"
              step="0.01"
              defaultValue={plan?.metasAmount ?? undefined}
              placeholder="0"
              className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {plan && (
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted"
            >
              Cancelar
            </button>
          )}
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white">Guardar</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-2xl font-bold">
          S/ {plan!.totalAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </p>
        <button onClick={() => setEditando(true)} className="text-xs text-accent font-medium">
          Editar
        </button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>Colchón: S/ {plan!.colchonAmount.toLocaleString("es-PE")}</span>
        <span>Inversión: S/ {plan!.inversionAmount.toLocaleString("es-PE")}</span>
        <span>Metas: S/ {plan!.metasAmount.toLocaleString("es-PE")}</span>
      </div>
    </div>
  );
}
