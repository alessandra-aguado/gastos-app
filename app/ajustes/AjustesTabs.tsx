"use client";

import { useState } from "react";
import { eliminarCategoria, eliminarCategoriasBulk, eliminarMedioDePago, eliminarMediosDePagoBulk, restaurarGasto } from "@/lib/actions";
import CategoryIcon from "../components/CategoryIcon";
import RowMenu from "../components/RowMenu";
import CategoriaModal from "./CategoriaModal";
import MedioModal from "./MedioModal";
import ReglaIngresoField from "./ReglaIngresoField";
import FormatoMontoField from "./FormatoMontoField";
import AlertaTarjetaField from "./AlertaTarjetaField";
import { Plus, Pencil, Trash2, History, CalendarClock, Mail } from "lucide-react";

type Categoria = { id: string; name: string; icon: string | null; color: string | null; description: string | null };
type Medio = { id: string; name: string; type: string; bankOrIssuer: string | null };
type Evento = { id: string; entity: string; action: string; label: string; snapshot?: unknown; restored?: boolean; createdAt: Date };
type Regla = { pctFijos: number; pctVariable: number; pctAhorro: number };

const ACCION_ICONO: Record<string, typeof Plus> = { crear: Plus, editar: Pencil, eliminar: Trash2 };
const ACCION_COLOR: Record<string, string> = { crear: "text-positive", editar: "text-accent", eliminar: "text-warning" };

export default function AjustesTabs({
  categorias,
  medios,
  historial,
  tabInicial,
  abrirNuevoMedio,
  regla,
  decimales,
  alertaTarjetaDefault,
}: {
  categorias: Categoria[];
  medios: Medio[];
  historial: Evento[];
  tabInicial?: string;
  abrirNuevoMedio?: boolean;
  regla: Regla;
  decimales: number;
  alertaTarjetaDefault: number;
}) {
  const [tab, setTab] = useState<"personalizable" | "categorias" | "medios" | "historial">(
    tabInicial === "medios" ? "medios" : tabInicial === "historial" ? "historial" : tabInicial === "categorias" ? "categorias" : "personalizable"
  );

  const [seleccionCat, setSeleccionCat] = useState<Set<string>>(new Set());
  const [seleccionMedio, setSeleccionMedio] = useState<Set<string>>(new Set());

  const [modalCategoria, setModalCategoria] = useState<Categoria | "new" | null>(null);
  const [modalMedio, setModalMedio] = useState<Medio | "new" | null>(abrirNuevoMedio ? "new" : null);

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
          onClick={() => { setTab("personalizable"); setError(null); }}
          className={`px-3.5 py-2 text-sm ${tab === "personalizable" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Personalizable
        </button>
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
        <button
          onClick={() => { setTab("historial"); setError(null); }}
          className={`px-3.5 py-2 text-sm ${tab === "historial" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Historial
        </button>
      </div>

      {error && (
        <div className="bg-warning-soft text-warning text-xs px-3.5 py-2.5 rounded-lg mb-3 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 shrink-0">✕</button>
        </div>
      )}

      {tab === "personalizable" ? (
        <>
          <ReglaIngresoField regla={regla} />
          <FormatoMontoField decimales={decimales} />
          <AlertaTarjetaField alertaTarjetaDefault={alertaTarjetaDefault} />

          <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">Integraciones</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-background text-muted border border-border">Vista previa</span>
            </div>
            <p className="text-xs text-muted mb-4">
              Así se vería conectar Miga con tus cuentas de Google. Todavía no está activo — es un adelanto para que veas cómo luciría antes de decidir si vale la pena construirlo.
            </p>

            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                  <CalendarClock size={18} strokeWidth={1.75} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted">Crea recordatorios automáticos de tus fechas de corte y vencimiento.</p>
                </div>
              </div>
              <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted cursor-not-allowed shrink-0">
                Conectar
              </button>
            </div>

            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                  <Mail size={18} strokeWidth={1.75} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium">Gmail</p>
                  <p className="text-xs text-muted">Detecta correos de tus bancos para sugerir gastos automáticamente.</p>
                </div>
              </div>
              <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted cursor-not-allowed shrink-0">
                Conectar
              </button>
            </div>
          </div>
        </>
      ) : tab === "categorias" ? (
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
      ) : tab === "medios" ? (
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
            <button
              onClick={() => setModalMedio("new")}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent transition-colors"
            >
              + Nuevo medio de pago
            </button>
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

        </>
      ) : (
        <>
          {historial.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-10 text-center text-muted text-sm">
              Aún no hay cambios registrados.
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
              {historial.map((e, i) => {
                const Icon = ACCION_ICONO[e.action] ?? History;
                const puedeRestaurar = e.entity === "Gasto" && e.action === "eliminar" && !!e.snapshot && !e.restored;
                return (
                  <div
                    key={e.id}
                    className={`flex items-start gap-3 px-4 py-3 ${i < historial.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <Icon size={15} strokeWidth={2} className={`mt-0.5 shrink-0 ${ACCION_COLOR[e.action] ?? "text-muted"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{e.label}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {e.entity} ·{" "}
                        {new Date(e.createdAt).toLocaleString("es-PE", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {puedeRestaurar && (
                      <form action={restaurarGasto} className="shrink-0">
                        <input type="hidden" name="logId" value={e.id} />
                        <button className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
                          Restaurar
                        </button>
                      </form>
                    )}
                    {e.restored && (
                      <span className="text-[10px] text-muted shrink-0 mt-1">Restaurado</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {modalCategoria && (
        <CategoriaModal
          categoria={modalCategoria === "new" ? null : modalCategoria}
          onClose={() => setModalCategoria(null)}
        />
      )}
      {modalMedio && (
        <MedioModal
          medio={modalMedio === "new" ? null : modalMedio}
          onClose={() => setModalMedio(null)}
        />
      )}
    </>
  );
}
