"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { guardarPlanPago, eliminarPlanPago } from "@/lib/actions";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";

type Plan = { id: string; month: string; amount: number };
type Deuda = { id: string; counterpartName: string | null; balance: number };

function labelMes(mes: string) {
  return new Date(`${mes}-01T00:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

export default function PlanPagoDeudaRow({ deuda, planes, mesesDisponibles }: { deuda: Deuda; planes: Plan[]; mesesDisponibles: string[] }) {
  const [agregando, setAgregando] = useState(false);
  const [mes, setMes] = useState(mesesDisponibles[0] || "");
  const [monto, setMonto] = useState(String(deuda.balance));
  const [guardando, setGuardando] = useState(false);
  const decimales = useDecimales();

  async function guardar() {
    if (!mes || !monto || parseFloat(monto) <= 0) return;
    setGuardando(true);
    const fd = new FormData();
    fd.set("debtId", deuda.id);
    fd.set("month", mes);
    fd.set("amount", monto);
    await guardarPlanPago(fd);
    setGuardando(false);
    setAgregando(false);
  }

  async function eliminar(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    await eliminarPlanPago(fd);
  }

  return (
    <div className="border border-border rounded-lg p-3 mb-2 last:mb-0">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">{deuda.counterpartName}</p>
        <span className="text-xs text-muted">Debes S/ {formatMonto(deuda.balance, decimales)}</span>
      </div>

      {planes.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {planes.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-xs bg-background rounded-lg px-2.5 py-1.5">
              <span className="capitalize">{labelMes(p.month)}: S/ {formatMonto(p.amount, decimales)}</span>
              <button onClick={() => eliminar(p.id)} className="text-muted hover:text-accent">
                <X size={13} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      {agregando ? (
        <div className="flex gap-1.5 items-center">
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 bg-background text-xs">
            {mesesDisponibles.map((m) => (
              <option key={m} value={m} className="capitalize">{labelMes(m)}</option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-xs"
            placeholder="Monto"
          />
          <button onClick={guardar} disabled={guardando} className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white disabled:opacity-60">
            {guardando ? "..." : "Guardar"}
          </button>
          <button onClick={() => setAgregando(false)} className="text-xs px-2 py-1.5 rounded-lg border border-border">✕</button>
        </div>
      ) : (
        <button onClick={() => setAgregando(true)} className="text-xs text-accent font-medium">+ Planear un pago</button>
      )}
    </div>
  );
}
