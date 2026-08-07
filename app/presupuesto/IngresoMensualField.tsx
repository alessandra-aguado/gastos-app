"use client";

import { useState } from "react";
import { updateIngresoMensual } from "@/lib/actions";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";

export default function IngresoMensualField({ monthlyIncome }: { monthlyIncome: number | null }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateIngresoMensual(fd);
          setEditando(false);
        }}
        className="flex justify-between items-center gap-2 text-sm mb-2.5"
      >
        <span className="text-muted">Ingreso mensual</span>
        <div className="flex gap-1.5 items-center">
          <input
            name="monthlyIncome"
            type="number"
            step="any"
            defaultValue={monthlyIncome ?? undefined}
            autoFocus
            placeholder="3500"
            className="w-24 border border-border rounded-lg px-2 py-1 bg-background text-xs"
          />
          <button className="text-xs px-2 py-1 rounded-lg bg-accent text-white">Guardar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex justify-between items-center text-sm text-muted mb-2.5">
      <span>Ingreso mensual</span>
      <button onClick={() => setEditando(true)} className="text-foreground font-medium hover:text-accent transition-colors">
        {monthlyIncome ? `S/ ${formatMonto(monthlyIncome, decimales)}` : "Definir →"}
      </button>
    </div>
  );
}
