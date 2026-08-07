"use client";

import { useState } from "react";
import { createDeseo } from "@/lib/actions";

type Categoria = { id: string; name: string };

export default function NuevoDeseoModal({ categorias }: { categorias: Categoria[] }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors">
        + Nuevo deseo
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setAbierto(false)}>
          <form
            action={async (fd) => {
              await createDeseo(fd);
              setAbierto(false);
            }}
            className="w-[380px] bg-surface rounded-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nuevo deseo</span>
              <button type="button" onClick={() => setAbierto(false)} className="text-muted">✕</button>
            </div>
            <label className="text-xs text-muted block mb-1">¿Qué quieres comprar?</label>
            <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="Laptop nueva" />
            <label className="text-xs text-muted block mb-1">Precio estimado</label>
            <input name="estimatedPrice" type="number" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5" placeholder="3500" />
            <label className="text-xs text-muted block mb-1">Categoría</label>
            <select name="categoryId" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-2.5">
              <option value="">Sin definir</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-muted mb-3">
              <input type="checkbox" name="isNecessary" />
              Es necesario (no un capricho)
            </label>
            <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Agregar deseo</button>
          </form>
        </div>
      )}
    </>
  );
}
