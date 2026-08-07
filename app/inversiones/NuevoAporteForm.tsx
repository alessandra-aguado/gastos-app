"use client";

import { useState } from "react";
import { createInversion } from "@/lib/actions";

export default function NuevoAporteForm() {
  const [tipo, setTipo] = useState<"variable" | "fija">("variable");

  return (
    <div className="border-t border-border pt-5">
      <p className="text-sm text-muted mb-3">Nuevo aporte</p>
      <form action={createInversion}>
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">Plataforma</label>
            <input name="platform" required className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" placeholder="Trii, BCP, BVL..." />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">Tipo</label>
            <select name="kind" value={tipo} onChange={(e) => setTipo(e.target.value as "variable" | "fija")} className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm">
              <option value="variable">Acciones / bolsa / fondo variable</option>
              <option value="fija">Renta fija (plazo fijo, fondo con TEA)</option>
            </select>
          </div>
        </div>
        <div className="mb-2.5">
          <label className="text-xs text-muted block mb-1">Instrumento</label>
          <input name="instrumentType" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" placeholder="Acciones EEUU, depósito a plazo..." />
        </div>
        {tipo === "variable" ? (
          <div className="mb-2.5">
            <label className="text-xs text-muted block mb-1">Monto aportado</label>
            <input name="amountContributed" type="number" required placeholder="500" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
          </div>
        ) : (
          <div className="mb-2.5">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Monto aportado</label>
                <input name="amountContributed" type="number" required placeholder="1500" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Tasa (TEA %)</label>
                <input name="tea" type="number" placeholder="4" className="w-full border border-border rounded-lg px-3 py-2 bg-surface text-sm" />
              </div>
            </div>
            <p className="text-xs text-accent mt-1.5">Ganancia estimada al año: calculada sola con la tasa.</p>
          </div>
        )}
        <button className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">Agregar aporte</button>
      </form>
    </div>
  );
}
