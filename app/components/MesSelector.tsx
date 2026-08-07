"use client";

import { useRouter } from "next/navigation";

function currentMonthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MesSelector({ mes }: { mes: string }) {
  const router = useRouter();
  const [y, m] = mes.split("-").map(Number);
  const fecha = new Date(y, m - 1, 1);
  const label = fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const esMesActual = mes === currentMonthKeyNow();

  const irA = (offset: number) => {
    const d = new Date(y, m - 1 + offset, 1);
    const nuevo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(nuevo === currentMonthKeyNow() ? "/" : `/?mes=${nuevo}`);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => irA(-1)}
        aria-label="Mes anterior"
        className="text-muted hover:text-accent text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors"
      >
        ‹
      </button>

      <label className="text-muted text-sm cursor-pointer relative px-1">
        Así vas en {label}
        <input
          type="month"
          value={mes}
          max={currentMonthKeyNow()}
          onChange={(e) => {
            if (!e.target.value) return;
            router.push(e.target.value === currentMonthKeyNow() ? "/" : `/?mes=${e.target.value}`);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        />
      </label>

      <button
        onClick={() => irA(1)}
        aria-label="Mes siguiente"
        disabled={esMesActual}
        className="text-muted hover:text-accent text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent-soft transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-default"
      >
        ›
      </button>

      {!esMesActual && (
        <button
          onClick={() => router.push("/")}
          className="text-xs text-accent ml-1 underline underline-offset-2"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
