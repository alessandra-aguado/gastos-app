"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { createFundMovement, updateFundMovement } from "@/lib/actions";

type Movimiento = {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string | null;
  imageUrl?: string | null;
};

function toDateInput(d: Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function hoy() {
  return toDateInput(new Date());
}

export default function MovimientoModal({
  accountId,
  movimiento,
  onClose,
}: {
  accountId: string;
  movimiento?: Movimiento;
  onClose?: () => void;
}) {
  const esEdicion = !!movimiento;
  const [abierto, setAbierto] = useState(esEdicion);
  const [tipo, setTipo] = useState<"ingreso" | "gasto">((movimiento?.type as "ingreso" | "gasto") || "gasto");
  const [foto, setFoto] = useState<File | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function cerrar() {
    setAbierto(false);
    setFoto(null);
    setQuitarFoto(false);
    setError("");
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo movimiento
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              setError("");
              fd.set("accountId", accountId);

              if (foto) {
                try {
                  setSubiendo(true);
                  const blob = await upload(`movimientos/${accountId}/${Date.now()}-${foto.name}`, foto, {
                    access: "public",
                    handleUploadUrl: "/api/movimiento-foto",
                  });
                  fd.set("imageUrl", blob.url);
                } catch {
                  setSubiendo(false);
                  setError("No se pudo subir la foto. Intenta de nuevo.");
                  return;
                }
                setSubiendo(false);
              }
              if (quitarFoto) fd.set("removeImage", "1");

              if (esEdicion) {
                fd.set("id", movimiento!.id);
                await updateFundMovement(fd);
              } else {
                await createFundMovement(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar movimiento" : "Nuevo movimiento"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1.5">Tipo</label>
            <div className="flex gap-1.5 mb-2.5">
              <button type="button" onClick={() => setTipo("ingreso")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "ingreso" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>
                Entra dinero
              </button>
              <button type="button" onClick={() => setTipo("gasto")} className={`flex-1 text-xs py-2 rounded-lg border ${tipo === "gasto" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}>
                Sale dinero
              </button>
            </div>
            <input type="hidden" name="type" value={tipo} />

            <label className="text-xs text-muted block mb-1">Monto</label>
            <input name="amount" type="number" step="any" required defaultValue={movimiento?.amount} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="45" />

            <label className="text-xs text-muted block mb-1">Fecha</label>
            <input name="date" type="date" required defaultValue={movimiento ? toDateInput(movimiento.date) : hoy()} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" />

            <label className="text-xs text-muted block mb-1">Descripción (opcional)</label>
            <textarea name="description" defaultValue={movimiento?.description || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5 h-16" placeholder="Pollo a la brasa para mi mamá, pagado con BBVA débito..." />

            <label className="text-xs text-muted block mb-1">Foto del comprobante (opcional)</label>

            {esEdicion && movimiento?.imageUrl && !quitarFoto && (
              <div className="flex items-center gap-2 mb-2">
                <a href={movimiento.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">
                  Ver foto actual
                </a>
                <button type="button" onClick={() => setQuitarFoto(true)} className="text-xs text-muted underline">
                  Quitar
                </button>
              </div>
            )}
            {quitarFoto && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted">Se eliminará la foto actual.</span>
                <button type="button" onClick={() => setQuitarFoto(false)} className="text-xs text-accent underline">
                  Deshacer
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted mb-1"
            />
            {foto && <p className="text-xs text-muted mb-2">{foto.name}</p>}
            {!foto && <div className="mb-2" />}

            {error && <p className="text-xs text-warning mb-2">{error}</p>}

            <button disabled={subiendo} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {subiendo ? "Subiendo foto..." : esEdicion ? "Guardar cambios" : "Agregar movimiento"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
