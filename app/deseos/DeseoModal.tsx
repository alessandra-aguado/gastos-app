"use client";

import { useState } from "react";
import { createDeseo, updateDeseo } from "@/lib/actions";

type Categoria = { id: string; name: string };
type Deseo = {
  id: string;
  name: string;
  estimatedPrice: number;
  categoryId: string | null;
  isNecessary: boolean;
  link?: string | null;
  notes?: string | null;
};

export default function DeseoModal({
  categorias,
  deseo,
  onClose,
}: {
  categorias: Categoria[];
  deseo?: Deseo;
  onClose?: () => void;
}) {
  const esEdicion = !!deseo;
  const [abierto, setAbierto] = useState(esEdicion);

  function cerrar() {
    setAbierto(false);
    onClose?.();
  }

  return (
    <>
      {!esEdicion && (
        <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
          + Nuevo deseo
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={cerrar}>
          <form
            action={async (fd) => {
              if (esEdicion) {
                fd.set("id", deseo!.id);
                await updateDeseo(fd);
              } else {
                await createDeseo(fd);
              }
              cerrar();
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">{esEdicion ? "Editar deseo" : "Nuevo deseo"}</span>
              <button type="button" onClick={cerrar} className="text-muted">✕</button>
            </div>
            <label className="text-xs text-muted block mb-1">¿Qué quieres comprar?</label>
            <input name="name" required defaultValue={deseo?.name || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Laptop nueva" />
            <label className="text-xs text-muted block mb-1">Precio estimado</label>
            <input name="estimatedPrice" type="number" required defaultValue={deseo?.estimatedPrice} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="3500" />
            <label className="text-xs text-muted block mb-1">Categoría</label>
            <select name="categoryId" defaultValue={deseo?.categoryId || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
              <option value="">Sin definir</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="text-xs text-muted block mb-1">Link (opcional)</label>
            <input name="link" type="url" defaultValue={deseo?.link || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="https://..." />
            <label className="text-xs text-muted block mb-1">Nota (opcional)</label>
            <textarea name="notes" defaultValue={deseo?.notes || ""} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5 h-12" placeholder="Por qué lo quieres..." />
            <label className="flex items-center gap-2 text-xs text-muted mb-3">
              <input type="checkbox" name="isNecessary" defaultChecked={deseo?.isNecessary} />
              Es necesario (no un capricho)
            </label>
            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">{esEdicion ? "Guardar cambios" : "Agregar deseo"}</button>
          </form>
        </div>
      )}
    </>
  );
}
