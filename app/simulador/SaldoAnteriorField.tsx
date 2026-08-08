"use client";

import { useState } from "react";
import { updateSaldoAnteriorSimulador } from "@/lib/actions";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";

export default function SaldoAnteriorField({ saldoAnterior, mesAnteriorLabel }: { saldoAnterior: number; mesAnteriorLabel: string }) {
  const [editando, setEditando] = useState(false);
  const decimales = useDecimales();

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateSaldoAnteriorSimulador(fd);
          setEditando(false);
        }}
        className="flex justify-between items-center gap-2 text-sm py-1"
      >
        <span className="text-muted">
          Saldo anterior <span className="text-[11px]">({mesAnteriorLabel})</span>
        </span>
        <div className="flex gap-1.5 items-center">
          <input
            name="saldoAnteriorSimulador"
            type="number"
            step="any"
            defaultValue={saldoAnterior || undefined}
            autoFocus
            placeholder="0"
            className="w-24 border border-border rounded-lg px-2 py-1 bg-background text-xs"
          />
          <button className="text-xs px-2 py-1 rounded-lg bg-accent text-white">Guardar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-muted">
        Saldo anterior <span className="text-[11px]">({mesAnteriorLabel})</span>
      </span>
      <button
        onClick={() => setEditando(true)}
        className={`hover:text-accent transition-colors ${saldoAnterior < 0 ? "text-warning" : saldoAnterior > 0 ? "text-positive" : "text-muted"}`}
      >
        S/ {formatMonto(saldoAnterior, decimales)}
      </button>
    </div>
  );
}
