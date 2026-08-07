"use client";

import { useState } from "react";
import { createInversion, updateInversion } from "@/lib/actions";

type Inversion = {
  id: string;
  platform: string;
  instrumentType: string;
  kind: string;
  amountContributed: number;
  tea: number | null;
};

const INSTRUMENTOS_VARIABLE = ["Acciones", "Bolsa / ETF", "Fondo mutuo variable"];
const INSTRUMENTOS_FIJA = ["Depósito a plazo fijo", "Fondo de renta fija"];

function toDateInputToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function InversionModal({ inversion, onClose }: { inversion?: Inversion; onClose?: () => void }) {
  const esEdicion = !!inversion;
  const [abierto, setAbierto] = useState(esEdicion);
  const [tipo, setTipo] = useState<"variable" | "fija">((inversion?.kind as "variable" | "fija") || "variable");

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 transition-opacity">
          + Nuevo aporte
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              if (esEdicion) {
                fd.set("id", inversion!.id);
                await updateInversion(fd);
              } else {
                await createInversion(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar aporte" : "Nuevo aporte"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">Plataforma / banco</label>
            <input name="platform" required defaultValue={inversion?.platform || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Trii, BCP, BVL..." />

            {!esEdicion && (
              <>
                <label className="text-xs text-muted block mb-1">Tipo</label>
                <select name="kind" value={tipo} onChange={(e) => setTipo(e.target.value as "variable" | "fija")} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="variable">Acciones / bolsa / fondo variable</option>
                  <option value="fija">Renta fija (plazo fijo, fondo con TEA)</option>
                </select>
              </>
            )}

            <label className="text-xs text-muted block mb-1">Instrumento</label>
            <select name="instrumentType" defaultValue={inversion?.instrumentType} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
              {(tipo === "variable" ? INSTRUMENTOS_VARIABLE : INSTRUMENTOS_FIJA).map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            <label className="text-xs text-muted block mb-1">Monto aportado</label>
            <input name="amountContributed" type="number" required defaultValue={inversion?.amountContributed} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="500" />

            {!esEdicion && (
              <>
                <label className="text-xs text-muted block mb-1">Fecha</label>
                <input name="date" type="date" defaultValue={toDateInputToday()} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />
              </>
            )}

            {tipo === "fija" && (
              <div className="flex gap-2 mb-2.5">
                <div className="flex-1">
                  <label className="text-xs text-muted block mb-1">Tasa (TEA %)</label>
                  <input name="tea" type="number" defaultValue={inversion?.tea ?? undefined} placeholder="4" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                </div>
                {!esEdicion && (
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Plazo (meses)</label>
                    <input name="termMonths" type="number" placeholder="6" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                  </div>
                )}
              </div>
            )}

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium mt-1">{esEdicion ? "Guardar cambios" : "Agregar aporte"}</button>
          </form>
        </div>
      )}
    </>
  );
}
