"use client";

import { useState, ReactNode } from "react";

export default function PresupuestoTabs({
  limites,
  planificados,
  proyeccion,
}: {
  limites: ReactNode;
  planificados: ReactNode;
  proyeccion: ReactNode;
}) {
  const [tab, setTab] = useState<"limites" | "planificados" | "proyeccion">("limites");

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-4">
        <button
          onClick={() => setTab("limites")}
          className={`px-3.5 py-2 text-sm ${tab === "limites" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Límites
        </button>
        <button
          onClick={() => setTab("planificados")}
          className={`px-3.5 py-2 text-sm ${tab === "planificados" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Planificados
        </button>
        <button
          onClick={() => setTab("proyeccion")}
          className={`px-3.5 py-2 text-sm ${tab === "proyeccion" ? "text-accent font-medium border-b-2 border-accent" : "text-muted"}`}
        >
          Proyección
        </button>
      </div>
      {tab === "limites" ? limites : tab === "planificados" ? planificados : proyeccion}
    </div>
  );
}
