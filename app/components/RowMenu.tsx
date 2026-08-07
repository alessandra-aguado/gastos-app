"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 144; // w-36

export default function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function actualizarPosicion() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
  }

  useEffect(() => {
    if (!abierto) return;
    actualizarPosicion();
    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [abierto]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
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

      {abierto &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
            <div
              className="fixed z-50 bg-surface border border-border rounded-lg shadow-[0_4px_12px_rgba(16,24,40,0.08)] py-1"
              style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            >
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
          </>,
          document.body
        )}
    </div>
  );
}
