"use client";

import { useState } from "react";
import { createDeuda, updateDeuda } from "@/lib/actions";

type Deuda = {
  id: string;
  type: string;
  counterpartName: string | null;
  direction: string | null;
  balance: number;
  creditLimit: number | null;
  minPayment: number | null;
  dueDay: number | null;
  interestRate: number | null;
  startDate: Date | null;
  paymentMethodId: string | null;
};

type Medio = { id: string; name: string };

function toDateInput(d: Date | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export default function DeudaModal({ deuda, medios, onClose }: { deuda?: Deuda; medios?: Medio[]; onClose?: () => void }) {
  const esEdicion = !!deuda;
  const [abierto, setAbierto] = useState(esEdicion);
  const [tipo, setTipo] = useState<"tarjeta_credito" | "prestamo_personal">(
    (deuda?.type as "tarjeta_credito" | "prestamo_personal") || "tarjeta_credito"
  );

  const mediosDisponibles = medios || [];
  const sinMedios = tipo === "tarjeta_credito" && mediosDisponibles.length === 0;

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
          + Nueva deuda
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              if (esEdicion) {
                fd.set("id", deuda!.id);
                await updateDeuda(fd);
              } else {
                await createDeuda(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar deuda" : "Nueva deuda"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            {!esEdicion && (
              <div className="flex gap-1.5 mb-3">
                <button type="button" onClick={() => setTipo("tarjeta_credito")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "tarjeta_credito" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Tarjeta de crédito</button>
                <button type="button" onClick={() => setTipo("prestamo_personal")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "prestamo_personal" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Préstamo personal</button>
              </div>
            )}
            <input type="hidden" name="type" value={tipo} />

            {tipo === "tarjeta_credito" ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-muted">Tarjeta de crédito</label>
                  <a href="/ajustes?tab=medios&nuevo=1" className="text-xs text-accent hover:underline">+ Nueva tarjeta de crédito</a>
                </div>
                {sinMedios ? (
                  <p className="text-xs text-muted border border-dashed border-border rounded-lg px-3 py-2.5 mb-3">
                    Aún no tienes ninguna tarjeta de crédito configurada en Medios de pago. Créala con el link de arriba y vuelve aquí.
                  </p>
                ) : (
                  <>
                    <select name="paymentMethodId" required defaultValue={deuda?.paymentMethodId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-1">
                      <option value="" disabled>Selecciona tu tarjeta</option>
                      {mediosDisponibles.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted mb-3">Los gastos que registres con esta tarjeta van a sumar automáticamente al saldo de esta deuda.</p>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="text-xs text-muted block mb-1">Nombre de la persona</label>
                <input name="counterpartName" required defaultValue={deuda?.counterpartName || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Juan, Sofía..." />

                <label className="text-xs text-muted block mb-1.5">¿Quién debe?</label>
                <select name="direction" defaultValue={deuda?.direction || "yo_debo"} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
                  <option value="yo_debo">Yo debo</option>
                  <option value="me_deben">Me deben</option>
                </select>
              </>
            )}

            {!sinMedios && (
              <>
                <label className="text-xs text-muted block mb-1">{tipo === "tarjeta_credito" ? "Deuda actual" : "Monto"}</label>
                <input name="balance" type="number" step="any" required defaultValue={deuda?.balance} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="230" />
                <input type="hidden" name="principalAmount" value="" />

                <label className="text-xs text-muted block mb-1">¿Desde cuándo?</label>
                <input name="startDate" type="date" defaultValue={toDateInput(deuda?.startDate ?? null)} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />

                {tipo === "prestamo_personal" && (
                  <>
                    <label className="text-xs text-muted block mb-1">Interés (opcional, %)</label>
                    <input name="interestRate" type="number" step="0.1" defaultValue={deuda?.interestRate ?? undefined} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="0" />
                  </>
                )}
              </>
            )}

            <button disabled={sinMedios} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium mt-1 disabled:opacity-40">{esEdicion ? "Guardar cambios" : "Guardar deuda"}</button>
          </form>
        </div>
      )}
    </>
  );
}
