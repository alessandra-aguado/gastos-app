"use client";

import { useState } from "react";
import { convertirDeseoEnMeta, marcarDeseoComprado } from "@/lib/actions";

type Deseo = {
  id: string;
  name: string;
  estimatedPrice: number;
  isNecessary: boolean;
  status: string;
  category: { name: string; icon: string | null } | null;
};

export default function DeseoRow({ deseo }: { deseo: Deseo }) {
  const [convirtiendo, setConvirtiendo] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex gap-2.5 items-center">
          <span className="text-lg">{deseo.category?.icon || "✨"}</span>
          <div>
            <p className="text-sm font-medium">{deseo.name}</p>
            <p className="text-xs text-muted">{deseo.category?.name || "Sin categoría"} · {deseo.isNecessary ? "necesario" : "innecesario"}</p>
          </div>
        </div>

        {deseo.status === "convertido_a_meta" ? (
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Meta creada</span>
        ) : deseo.status === "comprado" ? (
          <span className="bg-positive-soft text-positive text-[10px] font-medium px-2 py-1 rounded-md">Comprado</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">S/ {deseo.estimatedPrice.toFixed(0)}</span>
            <button onClick={() => setConvirtiendo(!convirtiendo)} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
              Convertir en meta
            </button>
            <form action={marcarDeseoComprado}>
              <input type="hidden" name="id" value={deseo.id} />
              <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Comprado</button>
            </form>
          </div>
        )}
      </div>

      {convirtiendo && (
        <form
          action={async (fd) => {
            await convertirDeseoEnMeta(fd);
            setConvirtiendo(false);
          }}
          className="mt-3 pt-3 border-t border-border flex gap-2 items-end"
        >
          <input type="hidden" name="wishlistItemId" value={deseo.id} />
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">¿Cómo la vas a lograr?</label>
            <select name="method" className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-xs">
              <option value="efectivo">Ahorro en efectivo</option>
              <option value="cuotas">Cuotas o crédito</option>
            </select>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white shrink-0">Crear meta</button>
        </form>
      )}
    </div>
  );
}
