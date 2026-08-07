"use client";

import { useState } from "react";
import { updateAlertaTarjetaDefault } from "@/lib/actions";

export default function AlertaTarjetaField({ alertaTarjetaDefault }: { alertaTarjetaDefault: number }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(alertaTarjetaDefault);

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateAlertaTarjetaDefault(fd);
          setEditando(false);
        }}
        className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4"
      >
        <p className="text-sm font-medium mb-1">Alerta de uso de tarjeta</p>
        <p className="text-xs text-muted mb-3">
          A partir de qué % de tu línea de crédito te avisamos, por defecto. Puedes poner un valor distinto por cada tarjeta en Deuda.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <input
            name="alertaTarjetaDefault"
            type="number"
            min="1"
            max="100"
            value={valor}
            onChange={(e) => setValor(parseInt(e.target.value, 10) || 0)}
            autoFocus
            className="w-20 border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
          />
          <span className="text-sm text-muted">%</span>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setValor(alertaTarjetaDefault);
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
          <p className="text-sm font-medium">Alerta de uso de tarjeta</p>
          <p className="text-xs text-muted mt-1">Default: {alertaTarjetaDefault}% de la línea de crédito</p>
        </div>
        <button onClick={() => setEditando(true)} className="text-xs text-accent font-medium shrink-0">
          Editar
        </button>
      </div>
    </div>
  );
}
