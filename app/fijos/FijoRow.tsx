"use client";

import { marcarFijoPagado } from "@/lib/actions";

type Fijo = {
  id: string;
  name: string;
  amount: number;
  dueMode: string;
  dueDay: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  lastPaidMonth: string | null;
  category: { name: string; icon: string | null };
};

export default function FijoRow({ fijo, ultimo, mesActual }: { fijo: Fijo; ultimo: boolean; mesActual: string }) {
  const pagado = fijo.lastPaidMonth === mesActual;
  const vence = fijo.dueMode === "unica" ? (fijo.dueDay ? `vence el ${fijo.dueDay}` : "sin vencimiento fijo") : `pagas entre el ${fijo.rangeStart} y el ${fijo.rangeEnd}`;

  return (
    <div className={`flex justify-between items-center px-4 py-3 ${!ultimo ? "border-b border-border" : ""}`}>
      <div className="flex gap-2.5 items-center">
        <span className="text-lg">{fijo.category.icon || "🔁"}</span>
        <div>
          <p className="text-sm font-medium">{fijo.name}</p>
          <p className="text-xs text-muted">{fijo.category.name} · {vence}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-sm">S/ {fijo.amount.toFixed(0)}</span>
        {pagado ? (
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Pagado</span>
        ) : (
          <form action={marcarFijoPagado}>
            <input type="hidden" name="id" value={fijo.id} />
            <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Marcar pagado</button>
          </form>
        )}
      </div>
    </div>
  );
}
