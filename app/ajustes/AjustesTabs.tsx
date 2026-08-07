"use client";

import { useState } from "react";
import { createMedioDePago, eliminarCategoria, eliminarCategoriasBulk, eliminarMedioDePago, eliminarMediosDePagoBulk } from "@/lib/actions";
import CategoryIcon from "../components/CategoryIcon";
import RowMenu from "../components/RowMenu";
import CategoriaModal from "./CategoriaModal";
import MedioModal from "./MedioModal";

type Categoria = { id: string; name: string; icon: string | null; color: string | null; description: string | null };
type Medio = { id: string; name: string; type: string; bankOrIssuer: string | null };

export default function AjustesTabs({ categorias, medios }: { categorias: Categoria[]; medios: Medio[] }) {
  const [tab, setTab] = useState<"categorias" | "medios">("categorias");

  const [seleccionCat, setSeleccionCat] = useState<Set<string>>(new Set());
  const [seleccionMedio, setSeleccionMedio] = useState<Set<string>>(new Set());

  const [modalCategoria, setModalCategoria] = useState<Categoria | "new" | null>(null);
  const [modalMedio, setModalMedio] = useState<Medio | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  function toggleCat(id: string) {
    setSeleccionCat((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMedio(id: string) {
    setSeleccionMedio((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function eliminarUnaCategoria(id: string) {
    setError(null);
    setProcesando(true);
    const res = await eliminarCategoria(id);
    setProcesando(false);
    if (!res.ok) setError(res.error || "No se pudo eliminar.");
  }

  async function eliminarSeleccionCat() {
    setError(null);
    setProcesando(true);
    const res = await eliminarCategoriasBulk(Array.from(seleccionCat));
    setProcesando(false);
    setSeleccionCat(new Set());
    if (!res.ok) setError(res.error || "No se pudo eliminar.");
  }

  async function eliminarUnMedio(id: string) {
    setError(null);
    setProcesando(true);
    const res = await eliminarMedioDePago(id);
    setProcesando(false);
    if (!res.ok) setError(res.error || "No se pudo eliminar.");
  }

  async function eliminarSeleccionMedios() {
    setError(null);
    setProcesando(true);
    const res = await eliminarMediosDePagoBulk(Array.from(seleccionMedio));
    setProcesando(false);
    setSeleccionMedio(new Set());
    if (!res.ok) setError(res.error || "No se pudo eliminar.");
  }

  return (
    <>
      <div className="flex gap-1 border-b border-border mb-4">
        <button
          onClick={() => { setTab("categorias"); setError(null); }}
          className={`px-3.5 py-2 text-sm ${tab === "categorias" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Categorías
        </button>
        <button
          onClick={() => { setTab("medios"); setError(null); }}
          className={`px-3.5 py-2 text-sm ${tab === "medios" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Medios de pago
        </button>
      </div>

      {error && (
        <div className="bg-warning-soft text-warning text-xs px-3.5 py-2.5 rounded-lg mb-3 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 shrink-0">✕</button>
        </div>
      )}

      {tab === "categorias" ? (
        <>
          <div className="flex justify-between items-center mb-3">
            {seleccionCat.size > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{seleccionCat.size} seleccionada{seleccionCat.size === 1 ? "" : "s"}</span>
                <button
                  onClick={eliminarSeleccionCat}
                  disabled={procesando}
                  className="text-xs px-3 py-1.5 rounded-lg border border-warning text-warning hover:bg-warning-soft transition-colors disabled:opacity-60"
                >
                  Eliminar seleccionadas
                </button>
                <button onClick={() => setSeleccionCat(new Set())} className="text-xs text-muted">Cancelar</button>
              </div>
            ) : <span />}
            <button
              onClick={() => setModalCategoria("new")}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors"
            >
              + Nueva categoría
            </button>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
            {categorias.map((c, i) => (
              <div key={c.id} className={`flex justify-between items-center px-4 py-3 ${i < categorias.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex gap-2.5 items-center min-w-0">
                  <input
                    type="checkbox"
                    checked={seleccionCat.has(c.id)}
                    onChange={() => toggleCat(c.id)}
                    className="shrink-0"
                  />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.color || "#F2F2F3" }}>
                    <CategoryIcon icon={c.icon} size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-muted truncate max-w-[280px]">{c.description}</p>}
                  </div>
                </div>
                <RowMenu onEdit={() => setModalCategoria(c)} onDelete={() => eliminarUnaCategoria(c.id)} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-3">
            {seleccionMedio.size > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{seleccionMedio.size} seleccionado{seleccionMedio.size === 1 ? "" : "s"}</span>
                <button
                  onClick={eliminarSeleccionMedios}
                  disabled={procesando}
                  className="text-xs px-3 py-1.5 rounded-lg border border-warning text-warning hover:bg-warning-soft transition-colors disabled:opacity-60"
                >
                  Eliminar seleccionados
                </button>
                <button onClick={() => setSeleccionMedio(new Set())} className="text-xs text-muted">Cancelar</button>
              </div>
            ) : <span />}
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden mb-3">
            {medios.map((m, i) => (
              <div key={m.id} className={`flex justify-between items-center px-4 py-3 ${i < medios.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={seleccionMedio.has(m.id)}
                    onChange={() => toggleMedio(m.id)}
                    className="shrink-0"
                  />
                  <p className="text-sm">{m.name} <span className="text-muted text-xs">· {m.type.replace("_", " ")}</span></p>
                </div>
                <RowMenu onEdit={() => setModalMedio(m)} onDelete={() => eliminarUnMedio(m.id)} />
              </div>
            ))}
          </div>
          <form action={createMedioDePago} className="bg-surface border border-dashed border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-2">Nuevo medio de pago</p>
            <div className="flex gap-2 mb-2">
              <input name="name" required placeholder="Nombre" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm" />
              <select name="type" className="flex-1 border border-border rounded-lg px-2 py-1.5 bg-background text-sm">
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="billetera_digital">Billetera digital</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
            <input name="bankOrIssuer" placeholder="Banco o emisor" className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm mb-2" />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">Agregar medio de pago</button>
          </form>
        </>
      )}

      {modalCategoria && (
        <CategoriaModal
          categoria={modalCategoria === "new" ? null : modalCategoria}
          onClose={() => setModalCategoria(null)}
        />
      )}
      {modalMedio && <MedioModal medio={modalMedio} onClose={() => setModalMedio(null)} />}
    </>
  );
}
