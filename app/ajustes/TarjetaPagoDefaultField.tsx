"use client";

import { useState } from "react";
import { updateTarjetaPagoDefault } from "@/lib/actions";

export default function TarjetaPagoDefaultField({ tarjetaPagoDefault }: { tarjetaPagoDefault: string }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(tarjetaPagoDefault);

  const label = (v: string) => (v === "total" ? "Pago total (dejas la tarjeta en cero cada mes)" : "Pago mínimo (10% del saldo)");

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateTarjetaPagoDefault(fd);
          setEditando(false);
        }}
        className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4"
      >
        <p className="text-sm font-medium mb-1">Cuotas de tarjeta por defecto</p>
        <p className="text-xs text-muted mb-3">
          Qué asumir en Proyección y Simulador cuando no tienes un plan de pago armado para una tarjeta ese mes. Si ya definiste
          un plan de pago (en Deuda o en el Simulador), ese plan siempre manda sobre este default.
        </p>
        <div className="flex flex-col gap-2 mb-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tarjetaPagoDefault"
              value="total"
              checked={valor === "total"}
              onChange={() => setValor("total")}
            />
            Pago total (dejas la tarjeta en cero cada mes)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="tarjetaPagoDefault"
              value="minimo"
              checked={valor === "minimo"}
              onChange={() => setValor("minimo")}
            />
            Pago mínimo (10% del saldo)
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setValor(tarjetaPagoDefault);
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
          <p className="text-sm font-medium">Cuotas de tarjeta por defecto</p>
          <p className="text-xs text-muted mt-1">Default: {label(tarjetaPagoDefault)}</p>
        </div>
        <button onClick={() => setEditando(true)} className="text-xs text-accent font-medium shrink-0">
          Editar
        </button>
      </div>
    </div>
  );
}
