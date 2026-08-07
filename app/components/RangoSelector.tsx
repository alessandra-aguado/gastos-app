"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronDown } from "lucide-react";
import { PRESETS, PRESET_LABELS, Preset, toDateInputValue } from "@/lib/dateRanges";

export default function RangoSelector({
  preset,
  label,
  desde,
  hasta,
}: {
  preset: Preset;
  label: string;
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [personalizado, setPersonalizado] = useState(false);
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);

  function elegir(p: Preset) {
    router.push(`/?rango=${p}`);
    setAbierto(false);
    setPersonalizado(false);
  }

  function aplicarPersonalizado() {
    if (!d || !h) return;
    router.push(`/?rango=personalizado&desde=${d}&hasta=${h}`);
    setAbierto(false);
    setPersonalizado(false);
  }

  return (
    <div className="relative mt-1">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 text-muted text-sm hover:text-accent transition-colors"
      >
        <CalendarRange size={14} strokeWidth={1.75} />
        {label}
        <ChevronDown size={14} strokeWidth={1.75} />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setAbierto(false); setPersonalizado(false); }} />
          <div className="absolute left-0 top-7 z-50 w-64 bg-surface border border-border rounded-xl shadow-[0_4px_16px_rgba(16,24,40,0.08)] p-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => elegir(p)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  preset === p && !personalizado ? "bg-accent-soft text-accent font-medium" : "hover:bg-hover"
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
            <button
              onClick={() => setPersonalizado((v) => !v)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                preset === "personalizado" ? "bg-accent-soft text-accent font-medium" : "hover:bg-hover"
              }`}
            >
              Personalizado
            </button>

            {personalizado && (
              <div className="p-2.5 border-t border-border mt-1 space-y-2">
                <div>
                  <label className="text-xs text-muted block mb-1">Desde</label>
                  <input
                    type="date"
                    value={d}
                    max={toDateInputValue(new Date())}
                    onChange={(e) => setD(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Hasta</label>
                  <input
                    type="date"
                    value={h}
                    max={toDateInputValue(new Date())}
                    onChange={(e) => setH(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 bg-background text-sm"
                  />
                </div>
                <button
                  onClick={aplicarPersonalizado}
                  disabled={!d || !h}
                  className="w-full text-sm bg-accent text-white rounded-lg py-1.5 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
