"use client";
import { Sparkles, Bot, AlertCircle } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { preguntarAsistente, type MensajeChat } from "@/lib/ia";

const sugerencias = [
  "¿En qué categoría gasté más este mes?",
  "¿Cuánto llevo ahorrado en total?",
  "¿Me alcanza para un gasto de S/500 este mes?",
  "¿Cómo van mis deudas?",
];

export default function AsistenciaIaPage() {
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  async function enviar() {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;
    setInput("");
    setError(null);
    const historialPrevio = mensajes;
    setMensajes((prev) => [...prev, { rol: "usuario", texto: pregunta }]);
    setCargando(true);
    try {
      const respuesta = await preguntarAsistente(pregunta, historialPrevio);
      setMensajes((prev) => [...prev, { rol: "ia", texto: respuesta }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener una respuesta.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Sparkles size={22} strokeWidth={1.75} />Asistencia IA</h1>
      <p className="text-muted text-sm mt-1 mb-6">Pregúntale sobre tu dinero. Solo sabe de lo que ya registraste.</p>

      <div className="flex-1 space-y-3 mb-4">
        {mensajes.length === 0 && !cargando && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shrink-0"><Bot size={14} strokeWidth={1.75} /></div>
            <div className="bg-accent-soft text-accent rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed">
              Hola, Ale. Pregúntame sobre tus gastos, presupuesto, deudas o metas — reviso tus datos reales para responderte.
            </div>
          </div>
        )}
        {mensajes.map((m, i) =>
          m.rol === "usuario" ? (
            <div key={i} className="flex justify-end">
              <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] rounded-tr-sm px-3.5 py-2.5 text-sm max-w-[80%]">{m.texto}</div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shrink-0"><Bot size={14} strokeWidth={1.75} /></div>
              <div className="bg-accent-soft text-accent rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed whitespace-pre-line">{m.texto}</div>
            </div>
          )
        )}
        {cargando && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shrink-0"><Bot size={14} strokeWidth={1.75} /></div>
            <div className="bg-accent-soft text-accent rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm">Pensando...</div>
          </div>
        )}
        {error && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-warning-soft flex items-center justify-center text-warning shrink-0"><AlertCircle size={14} strokeWidth={1.75} /></div>
            <div className="bg-warning-soft text-warning rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%]">{error}</div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {sugerencias.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent transition-colors text-muted"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviar();
          }}
          disabled={cargando}
          placeholder="Pregúntale algo sobre tus gastos..."
          className="flex-1 border border-border rounded-lg px-4 py-2.5 bg-surface text-sm disabled:opacity-60"
        />
        <button
          onClick={enviar}
          disabled={cargando || !input.trim()}
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
