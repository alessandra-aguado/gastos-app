"use client";

import { useState } from "react";
import { createMeta } from "@/lib/actions";
import { Banknote, Receipt } from "lucide-react";
import { useDecimales } from "../components/DecimalesProvider";
import { formatMonto } from "@/lib/format";

export default function NuevaMetaModal() {
  const decimales = useDecimales();
  const [abierto, setAbierto] = useState(false);
  const [comoLograr, setComoLograr] = useState<"efectivo" | "cuotas">("efectivo");
  const [esPorcentaje, setEsPorcentaje] = useState(false);
  const [valorTotal, setValorTotal] = useState(150000);
  const [porcentaje, setPorcentaje] = useState(35);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="text-sm px-4 py-2 rounded-lg border border-border hover:border-accent transition-colors"
      >
        + Nueva meta
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-5 z-50" onClick={() => setAbierto(false)}>
          <form
            action={async (fd) => {
              await createMeta(fd);
              setAbierto(false);
            }}
            className="w-[380px] bg-surface rounded-xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-sm font-medium">Nueva meta</span>
              <button type="button" onClick={() => setAbierto(false)} className="text-muted">✕</button>
            </div>

            <label className="text-xs text-muted block mb-1">¿Para qué estás ahorrando?</label>
            <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" placeholder="Curso de inglés, depa, fondo de emergencia..." />

            <label className="text-xs text-muted block mb-1.5">¿Cómo la vas a lograr?</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setComoLograr("efectivo")}
                className={`flex-1 text-xs py-2 rounded-lg border ${comoLograr === "efectivo" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                <span className="inline-flex items-center gap-1.5"><Banknote size={14} strokeWidth={1.75} />Ahorro en efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setComoLograr("cuotas")}
                className={`flex-1 text-xs py-2 rounded-lg border ${comoLograr === "cuotas" ? "bg-accent-soft text-accent border-accent" : "border-border"}`}
              >
                <span className="inline-flex items-center gap-1.5"><Receipt size={14} strokeWidth={1.75} />Cuotas o crédito</span>
              </button>
            </div>
            <input type="hidden" name="method" value={comoLograr} />

            {comoLograr === "efectivo" ? (
              <>
                <label className="flex items-center gap-2 text-xs text-muted mb-3">
                  <input type="checkbox" name="isPercentageGoal" checked={esPorcentaje} onChange={(e) => setEsPorcentaje(e.target.checked)} />
                  Es un % de un valor mayor (ej. cuota inicial)
                </label>

                {esPorcentaje ? (
                  <div className="mb-3">
                    <div className="flex gap-2 mb-1.5">
                      <div className="flex-1">
                        <label className="text-xs text-muted block mb-1">Valor total</label>
                        <input
                          name="totalValue"
                          type="number" step="any"
                          value={valorTotal}
                          onChange={(e) => setValorTotal(Number(e.target.value))}
                          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted block mb-1">% que necesitas</label>
                        <input
                          name="percentage"
                          type="number"
                          value={porcentaje}
                          onChange={(e) => setPorcentaje(Number(e.target.value))}
                          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Tu meta sería ahorrar{" "}
                      <span className="text-accent font-medium">
                        S/ {formatMonto(Math.round((valorTotal * porcentaje) / 100), decimales)}
                      </span>
                      . El resto se asume financiado, no es deuda hasta que compres.
                    </p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="text-xs text-muted block mb-1">¿Cuánto necesitas en total?</label>
                    <input name="targetAmount" type="number" step="any" placeholder="1200" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                  </div>
                )}

                <label className="text-xs text-muted block mb-1">¿Para cuándo te gustaría lograrlo?</label>
                <input name="targetDate" type="date" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3" />

                <label className="text-xs text-muted block mb-1">¿Por qué te importa esta meta?</label>
                <textarea name="motivo" placeholder="Para poder aplicar a un mejor trabajo..." className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm mb-3 h-12" />

                <label className="flex items-start gap-2 text-xs text-muted mb-3.5">
                  <input type="checkbox" name="isEmergencyFund" className="mt-0.5" />
                  <span>Usar como mi fondo de emergencia<br /><span className="text-[11px]">La usaremos como colchón cuando tengas deudas en cuotas.</span></span>
                </label>

                <button className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium">Crear meta</button>
              </>
            ) : (
              <div className="bg-accent-soft rounded-xl p-3.5">
                <p className="text-xs text-accent mb-2.5 leading-relaxed">
                  Esto es una deuda con pagos fijos, no una meta de ahorro. Regístrala en Deuda y la vamos a reflejar como gasto fijo cada mes en tu Proyección.
                </p>
                <a href="/debo" className="block text-center text-xs py-2 rounded-lg border border-border">Ir a Deuda →</a>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
