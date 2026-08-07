"use client";

import { useState } from "react";

const metas = [
  { icon: "🎓", nombre: "Curso de inglés", fecha: "dic 2026", actual: 720, objetivo: 1200, estado: "Vas bien" },
  { icon: "🏠", nombre: "Depa", fecha: "jun 2028", actual: 4500, objetivo: 25000, nota: "Ahorra ~S/ 930/mes para llegar a tiempo." },
  { icon: "🛋️", nombre: "Decoración del cuarto", fecha: "sin fecha", actual: 3000, objetivo: 30000 },
  { icon: "💻", nombre: "Laptop nueva", fecha: "desde tus deseos ✨", actual: 3500, objetivo: 3500, estado: "Cumplida", cumplida: true },
];

export default function MetasPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [comoLograr, setComoLograr] = useState<"efectivo" | "cuotas">("efectivo");
  const [esPorcentaje, setEsPorcentaje] = useState(true);
  const [valorTotal, setValorTotal] = useState(150000);
  const [porcentaje, setPorcentaje] = useState(35);

  const total = metas.reduce((s, m) => s + m.actual, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold">🎯 Metas</h1>
          <p className="text-muted text-sm mt-1">S/ {total.toLocaleString("es-PE")} ahorrados en {metas.length} metas</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors"
        >
          + Nueva meta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metas.map((m) => {
          const pct = Math.round((m.actual / m.objetivo) * 100);
          return (
            <div key={m.nombre} className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4">
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex gap-2.5 items-center">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{m.nombre}</p>
                    <p className="text-xs text-muted">{m.fecha}</p>
                  </div>
                </div>
                {m.estado && (
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${m.cumplida ? "bg-positive-soft text-positive" : "bg-positive-soft text-positive"}`}>
                    {m.estado}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-background overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.cumplida ? "var(--positive)" : "var(--accent)" }} />
              </div>
              <div className="flex justify-between text-xs text-muted mb-2.5">
                <span><span className="text-foreground font-medium">S/ {m.actual.toLocaleString("es-PE")}</span> de S/ {m.objetivo.toLocaleString("es-PE")}</span>
                <span>{pct}%</span>
              </div>
              {m.nota && <p className="text-xs text-muted mb-2.5">{m.nota}</p>}
              <button className="w-full text-xs py-1.5 rounded-lg border border-border hover:border-accent transition-colors">
                {m.cumplida ? "Marcar como comprada" : "+ Abonar"}
              </button>
            </div>
          );
        })}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setModalAbierto(false)}>
          <div className="w-[380px] bg-surface rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva meta</span>
              <button onClick={() => setModalAbierto(false)} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">¿Para qué estás ahorrando?</label>
            <input className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" placeholder="Curso de inglés, depa, fondo de emergencia..." />

            <label className="text-xs text-muted block mb-1.5">¿Cómo la vas a lograr?</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setComoLograr("efectivo")}
                className={`flex-1 text-xs py-2 rounded-lg border ${comoLograr === "efectivo" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                💰 Ahorro en efectivo
              </button>
              <button
                onClick={() => setComoLograr("cuotas")}
                className={`flex-1 text-xs py-2 rounded-lg border ${comoLograr === "cuotas" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                🧾 Cuotas o crédito
              </button>
            </div>

            {comoLograr === "efectivo" ? (
              <>
                <label className="flex items-center gap-2 text-xs text-muted mb-3">
                  <input type="checkbox" checked={esPorcentaje} onChange={(e) => setEsPorcentaje(e.target.checked)} />
                  Es un % de un valor mayor (ej. cuota inicial)
                </label>

                {esPorcentaje ? (
                  <div className="mb-3">
                    <div className="flex gap-2 mb-1.5">
                      <div className="flex-1">
                        <label className="text-xs text-muted block mb-1">Valor total</label>
                        <input
                          type="number"
                          value={valorTotal}
                          onChange={(e) => setValorTotal(Number(e.target.value))}
                          className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted block mb-1">% que necesitas</label>
                        <input
                          type="number"
                          value={porcentaje}
                          onChange={(e) => setPorcentaje(Number(e.target.value))}
                          className="w-full border border-border rounded-xl px-3 py-2 bg-background text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Tu meta sería ahorrar{" "}
                      <span className="text-accent font-medium">
                        S/ {Math.round((valorTotal * porcentaje) / 100).toLocaleString("es-PE")}
                      </span>
                      . El resto se asume financiado, no es deuda hasta que compres.
                    </p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="text-xs text-muted block mb-1">¿Cuánto necesitas en total?</label>
                    <input type="number" placeholder="1200" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                  </div>
                )}

                <label className="text-xs text-muted block mb-1">¿Ya tienes algo ahorrado?</label>
                <input type="number" placeholder="0" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

                <label className="text-xs text-muted block mb-1">¿Para cuándo te gustaría lograrlo?</label>
                <input type="date" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

                <label className="text-xs text-muted block mb-1">¿Por qué te importa esta meta?</label>
                <textarea placeholder="Para poder aplicar a un mejor trabajo..." className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3 h-12" />

                <label className="flex items-start gap-2 text-xs text-muted mb-3.5">
                  <input type="checkbox" className="mt-0.5" />
                  <span>Usar como mi fondo de emergencia<br /><span className="text-[11px]">La usaremos como colchón cuando tengas deudas en cuotas.</span></span>
                </label>

                <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Crear meta</button>
              </>
            ) : (
              <div className="bg-accent-soft rounded-xl p-3.5">
                <p className="text-xs text-accent mb-2.5 leading-relaxed">
                  Esto es una deuda con pagos fijos, no una meta de ahorro. Regístrala en Debo y la vamos a reflejar como gasto fijo cada mes en tu Proyección.
                </p>
                <a href="/debo" className="block text-center text-xs py-2 rounded-lg border border-border">Ir a Debo →</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
