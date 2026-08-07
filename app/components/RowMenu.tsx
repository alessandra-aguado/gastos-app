"use client";

import { useState } from "react";

export default function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAbierto((v) => !v);
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-hover transition-colors"
        aria-label="Más opciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-surface border border-border rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.08)] py-1">
            <button
              onClick={() => {
                setAbierto(false);
                onEdit();
              }}
              className="w-full text-left text-xs px-3 py-2 hover:bg-hover transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => {
                setAbierto(false);
                onDelete();
              }}
              className="w-full text-left text-xs px-3 py-2 hover:bg-hover transition-colors text-warning"
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
