"use client";
import { Sparkles, Bot } from "lucide-react";

import { useState } from "react";

const conversacionInicial = [
  { rol: "usuario", texto: "¿Cuál fue mi gasto más caro este mes?" },
  { rol: "ia", texto: "Fue S/ 450 en tu cuota de Interbank el 20 de agosto. En consumo del día a día, tu gasto más caro fue S/ 87 en Tottus." },
  { rol: "usuario", texto: "¿Dónde me sale más barata la leche?" },
  { rol: "ia", texto: "En tus últimos 3 meses, la leche te costó en promedio S/ 8.20 en Tottus y S/ 7.50 en el mercado de tu zona. El mercado te sale más barato." },
  { rol: "usuario", texto: "¿Me alcanza para la laptop este mes?" },
  { rol: "ia", texto: "Ahora tienes S/ 2,100 disponibles después de fijos y deudas. La laptop cuesta S/ 3,500, así que no te alcanza aún — pero a tu ritmo de ahorro actual, la tendrías para marzo 2026." },
];

const sugerencias = [
  "¿En qué categoría gasté más este mes?",
  "¿Cuánto llevo ahorrado en total?",
  "¿Me conviene financiar el diplomado?",
];

export default function AsistenciaIaPage() {
  const [input, setInput] = useState("");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Sparkles size={22} strokeWidth={1.75} />Asistencia IA</h1>
      <p className="text-muted text-sm mt-1 mb-6">Pregúntale sobre tu dinero. Solo sabe de lo que ya registraste.</p>

      <div className="flex-1 space-y-3 mb-4">
        {conversacionInicial.map((m, i) =>
          m.rol === "usuario" ? (
            <div key={i} className="flex justify-end">
              <div className="bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] rounded-tr-sm px-3.5 py-2.5 text-sm max-w-[80%]">{m.texto}</div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white shrink-0"><Bot size={14} strokeWidth={1.75} /></div>
              <div className="bg-accent-soft text-accent rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed">{m.texto}</div>
            </div>
          )
        )}
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
          placeholder="Pregúntale algo sobre tus gastos..."
          className="flex-1 border border-border rounded-lg px-4 py-2.5 bg-surface text-sm"
        />
        <button className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shrink-0">
          Enviar
        </button>
      </div>
    </div>
  );
}
