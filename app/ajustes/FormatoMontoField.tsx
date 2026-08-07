"use client";

import { useState } from "react";
import { updateDecimales } from "@/lib/actions";

const OPCIONES = [0, 1, 2, 3];

export default function FormatoMontoField({ decimales }: { decimales: number }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(decimales);

  const ejemplo = (1234.5678).toLocaleString("es-PE", { minimumFractionDigits: valor, maximumFractionDigits: valor });

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await updateDecimales(fd);
          setEditando(false);
        }}
        className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4"
      >
        <p className="text-sm font-medium mb-1">Formato de montos</p>
        <p className="text-xs text-muted mb-3">
          Cuántos decimales mostrar en los montos en soles de toda la app. Es solo visual, no cambia los datos guardados.
        </p>
        <input type="hidden" name="decimales" value={valor} />
        <div className="flex gap-1.5 mb-2">
          {OPCIONES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValor(n)}
              className={`flex-1 text-xs py-2 rounded-lg border ${valor === n ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
            >
              {n} decimal{n === 1 ? "" : "es"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mb-3">Ejemplo: S/ {ejemplo}</p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setValor(decimales);
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
          <p className="text-sm font-medium">Formato de montos</p>
          <p className="text-xs text-muted mt-1">
            {decimales} decimal{decimales === 1 ? "" : "es"} · ejemplo S/ {ejemplo}
          </p>
        </div>
        <button onClick={() => setEditando(true)} className="text-xs text-accent font-medium shrink-0">
          Editar
        </button>
      </div>
    </div>
  );
}
