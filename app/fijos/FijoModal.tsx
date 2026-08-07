"use client";

import { useState } from "react";
import { createFijo, updateFijo } from "@/lib/actions";

type Categoria = { id: string; name: string };
type Medio = { id: string; name: string };
type Fijo = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  paymentMethodId: string | null;
  dueMode: string;
  dueDay: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  reminderDays: number;
  syncCalendar: boolean;
};

export default function FijoModal({
  categorias,
  medios,
  fijo,
  onClose,
}: {
  categorias: Categoria[];
  medios: Medio[];
  fijo?: Fijo;
  onClose?: () => void;
}) {
  const esEdicion = !!fijo;
  const [abierto, setAbierto] = useState(esEdicion);
  const [comoVence, setComoVence] = useState<"unica" | "rango">((fijo?.dueMode as "unica" | "rango") || "rango");

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
          + Nuevo fijo
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              if (esEdicion) {
                fd.set("id", fijo!.id);
                await updateFijo(fd);
              } else {
                await createFijo(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar fijo" : "Nuevo fijo"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">Nombre</label>
            <input name="name" required defaultValue={fijo?.name || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Internet" />

            <div className="flex gap-2 mb-2.5">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Categoría</label>
                <select name="categoryId" required defaultValue={fijo?.categoryId} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm">
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Monto</label>
                <input name="amount" type="number" required defaultValue={fijo?.amount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" placeholder="90" />
              </div>
            </div>

            <label className="text-xs text-muted block mb-1">Medio de pago</label>
            <select name="paymentMethodId" defaultValue={fijo?.paymentMethodId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-1">
              <option value="">Sin definir</option>
              {medios.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted mb-3">Tus medios de pago se agregan en Ajustes.</p>

            <label className="text-xs text-muted block mb-1.5">¿Cómo se paga?</label>
            <div className="flex gap-2 mb-2.5">
              <button type="button" onClick={() => setComoVence("unica")} className={`flex-1 text-xs py-2 rounded-lg border ${comoVence === "unica" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Fecha única</button>
              <button type="button" onClick={() => setComoVence("rango")} className={`flex-1 text-xs py-2 rounded-lg border ${comoVence === "rango" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>Rango de pago</button>
            </div>
            <input type="hidden" name="dueMode" value={comoVence} />

            {comoVence === "unica" ? (
              <div className="mb-2.5">
                <label className="text-xs text-muted block mb-1">¿Qué día del mes vence?</label>
                <input name="dueDay" type="number" defaultValue={fijo?.dueDay ?? 5} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
              </div>
            ) : (
              <div className="mb-2.5">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Se emite el día</label>
                    <input name="rangeStart" type="number" defaultValue={fijo?.rangeStart ?? 5} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Vence el día</label>
                    <input name="rangeEnd" type="number" defaultValue={fijo?.rangeEnd ?? 20} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                  </div>
                </div>
                <p className="text-xs text-muted mt-1.5">Puedes pagarlo cualquier día dentro de ese rango.</p>
              </div>
            )}

            <label className="text-xs text-muted block mb-1">¿Cuántos días antes te recuerdo?</label>
            <input name="reminderDays" type="number" defaultValue={fijo?.reminderDays ?? 0} placeholder="0 = el mismo día" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />

            <label className="flex items-start gap-2 text-xs text-muted mb-3">
              <input type="checkbox" name="syncCalendar" defaultChecked={fijo ? fijo.syncCalendar : true} className="mt-0.5" />
              Enviar recordatorio a Google Calendar
            </label>

            <div className="bg-accent-soft rounded-xl p-3 mb-3.5">
              <p className="text-xs text-accent leading-relaxed">Al marcarlo pagado se registra solo en Gastos, con esta categoría y medio de pago.</p>
            </div>

            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">{esEdicion ? "Guardar cambios" : "Guardar fijo"}</button>
          </form>
        </div>
      )}
    </>
  );
}
